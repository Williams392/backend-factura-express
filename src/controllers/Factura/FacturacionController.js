// src/controllers/Factura/FacturacionController.js
const forge = require('node-forge');
const zip = require('adm-zip');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom'); // Importar desde @xmldom/xmldom
const Emisor = require('../../models/Emisor');


// PASO 02: FIRMAR EL XML
exports.firmarXML = async (req, res) => {
    try {
        const { rutaXML } = req.body; // Ruta del XML generado
        console.log(`Ruta del XML: ${rutaXML}`);
        const emisor = await Emisor.findOne();
        console.log(`Emisor encontrado: ${JSON.stringify(emisor)}`);

        if (!emisor.certificado || !emisor.clave_certificado) {
            return res.status(400).json({ error: 'El emisor no tiene un certificado asignado' });
        }

        const certificadoPath = path.join(__dirname, '../../documents/certificados/', emisor.certificado);
        console.log(`Ruta del certificado: ${certificadoPath}`);
        const pfx = fs.readFileSync(certificadoPath);

        // Procesar el certificado en formato DER
        const p12Asn1 = forge.asn1.fromDer(pfx.toString('binary'));
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, emisor.clave_certificado);

        // Intentar obtener las claves privadas del certificado
        const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
        const keyObj = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];

        if (!keyObj || !keyObj[0] || !keyObj[0].key) {
            return res.status(400).json({ error: 'No se pudo encontrar la clave privada en el certificado' });
        }

        const privateKey = keyObj[0].key;

        // Verificar que la clave privada tiene el método sign
        if (!privateKey.sign) {
            return res.status(500).json({ error: 'La clave privada no tiene el método sign.' });
        }

        // Leer el contenido del XML
        const xmlContent = fs.readFileSync(path.resolve(rutaXML), 'utf8');
        const doc = new DOMParser().parseFromString(xmlContent, 'text/xml');

        // Crear un hash del contenido del XML
        const md = forge.md.sha256.create();
        md.update(xmlContent, 'utf8');

        // Firmar el hash usando la clave privada
        const signature = privateKey.sign(md);

        // Convertir la firma a base64
        const signatureBase64 = forge.util.encode64(signature);

        // Crear el nodo de la firma digital
        const signatureNode = doc.createElement('ds:Signature');
        const signatureValueNode = doc.createElement('ds:SignatureValue');
        signatureValueNode.appendChild(doc.createTextNode(signatureBase64));
        signatureNode.appendChild(signatureValueNode);

        // Insertar la firma en el nodo <ext:ExtensionContent>
        const extensionContentNode = doc.getElementsByTagName('ext:ExtensionContent')[0];
        if (!extensionContentNode) {
            return res.status(400).json({ error: 'No se encontró la etiqueta <ext:ExtensionContent> en el XML' });
        }
        extensionContentNode.appendChild(signatureNode);

        // Serializar el XML de vuelta a una cadena
        const signedXML = new XMLSerializer().serializeToString(doc);

        // Guardar el XML firmado
        fs.writeFileSync(path.resolve(rutaXML), signedXML);

        res.json({ message: 'XML firmado correctamente', ruta: rutaXML });
    } catch (error) {
        console.error('Error al firmar el XML:', error);
        res.status(500).json({ error: 'Error al firmar el XML' });
    }
};


// PASO 03: ZIPAR EL XML:
// Utiliza la librería adm-zip para comprimir el XML firmado:
exports.comprimirXML = async (req, res) => {
    const { rutaXML } = req.body;
    const nombreZIP = rutaXML.replace('.xml', '.zip');
    const zipFile = new zip();
    zipFile.addLocalFile(rutaXML);
    zipFile.writeZip(`../../documents/zip/${nombreZIP}`);
    res.json({ message: 'Archivo comprimido correctamente', zip: nombreZIP });
};





// PASO 03: ZIPAR EL XML - BIEN
exports.comprimirXML = async (req, res) => {
    try {
        const { rutaXML } = req.body;
        const nombreZIP = path.basename(rutaXML).replace('.xml', '.zip');
        const zipFile = new zip();
        zipFile.addLocalFile(path.resolve(rutaXML));
        const zipPath = path.join(__dirname, '../../documents/zip/', nombreZIP);
        zipFile.writeZip(zipPath);
        res.json({ message: 'Archivo comprimido correctamente', zip: zipPath });
    } catch (error) {
        console.error('Error al comprimir el XML:', error);
        res.status(500).json({ error: 'Error al comprimir el XML' });
    }
};

// PASO 04 y 05: PREPARAR Y ENVIAR LA CARTA DE ENVÍO A SUNAT
exports.enviarASunat = async (req, res) => {
    try {
        const { nombreZIP } = req.body;

        // Verificar si el nombre del archivo ZIP fue proporcionado
        if (!nombreZIP) {
            return res.status(400).json({ error: 'El nombre del archivo ZIP es obligatorio.' });
        }

        // Construir la ruta al archivo ZIP
        const zipPath = path.join(__dirname, '../../documents/zip/', nombreZIP);

        // Verificar si el archivo ZIP existe
        if (!fs.existsSync(zipPath)) {
            return res.status(404).json({ error: 'El archivo ZIP no fue encontrado.' });
        }

        // Leer el contenido del archivo ZIP y convertirlo a base64
        const zipContent = fs.readFileSync(zipPath).toString('base64');

        // Obtener los datos del emisor desde la base de datos
        const emisor = await Emisor.findOne();

        // Verificar si el emisor fue encontrado
        if (!emisor) {
            return res.status(404).json({ error: 'Datos del emisor no encontrados.' });
        }

        // Crear el contenido XML para la solicitud SOAP
        const xmlEnvio = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.sunat.gob.pe" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
            <soapenv:Header>
                <wsse:Security>
                    <wsse:UsernameToken>
                        <wsse:Username>${emisor.ruc}${emisor.usuario_emisor}</wsse:Username>
                        <wsse:Password>${emisor.clave_emisor}</wsse:Password>
                    </wsse:UsernameToken>
                </wsse:Security>
            </soapenv:Header>
            <soapenv:Body>
                <ser:sendBill>
                    <fileName>${nombreZIP}</fileName>
                    <contentFile>${zipContent}</contentFile>
                </ser:sendBill>
            </soapenv:Body>
        </soapenv:Envelope>`;

        // Hacer la solicitud POST a SUNAT usando axios
        const response = await axios.post('https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService', xmlEnvio, {
            headers: {
                'Content-Type': 'text/xml'
            }
        });

        // Verificar si SUNAT devolvió algún error
        if (response.status !== 200) {
            console.error('Error en la respuesta de SUNAT:', response.data);
            return res.status(response.status).json({ error: 'Error en la respuesta de SUNAT', detalles: response.data });
        }

        // Devolver la respuesta exitosa
        res.json({ response: response.data });

    } catch (error) {
        console.error('Error al enviar a SUNAT:', error);

        // Verificar si el error tiene más detalles específicos
        if (error.response) {
            return res.status(error.response.status).json({ 
                error: 'Error al enviar a SUNAT', 
                detalles: error.response.data 
            });
        }

        // Respuesta genérica en caso de un error inesperado
        res.status(500).json({ error: 'Error al enviar a SUNAT', detalles: error.message });
    }
};


// PASO 06: LEER LA RESPUESTA DE SUNAT
exports.leerRespuestaSunat = async (req, res) => {
    const { nombreZIP } = req.body;
    const rutaCDR = path.join(__dirname, '../../documents/cdr/', `R-${nombreZIP}`);
    const response = req.body.response; // Asumiendo que la respuesta de SUNAT está en el cuerpo de la solicitud

    const httpcode = response.status;
    if (httpcode === 200) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data, 'text/xml');
        const applicationResponse = doc.getElementsByTagName('applicationResponse')?.textContent;

        if (applicationResponse) {
            const cdr = Buffer.from(applicationResponse, 'base64');
            fs.writeFileSync(rutaCDR, cdr);

            const zip = new zip();
            if (zip.open(rutaCDR) === true) {
                zip.extractAllTo(path.join(__dirname, '../../documents/cdr/', `R-${nombreZIP.replace('.zip', '')}`), true);
                zip.close();
            }

            res.json({ message: 'Factura enviada correctamente', cdr: rutaCDR });
        } else {
            const faultcode = doc.getElementsByTagName('faultcode')?.textContent;
            const faultstring = doc.getElementsByTagName('faultstring')?.textContent;
            res.status(500).json({ error: `Error ${faultcode}: ${faultstring}` });
        }
    } else {
        res.status(500).json({ error: 'Problema de conexión' });
    }
};
