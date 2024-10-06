// controllers/FacturacionController.js.

const { SignedXml } = require('xml-crypto');
const { parseStringPromise, Builder } = require('xml2js');

const zip = require('adm-zip');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom'); // Importar desde el paquete moderno
const Emisor = require('../../models/Emisor');
const forge = require('node-forge');
const xmlFormatter = require('xml-formatter');
const crypto = require('crypto');
//const pki = require('node-forge').pki;


// PASO 02: FIRMAR EL XML
exports.firmarXML = async (req, res) => {
    try {
        const { rutaXML } = req.body;
        console.log(`Ruta del XML: ${rutaXML}`);
        const emisor = await Emisor.findOne();
        console.log(`Emisor encontrado: ${JSON.stringify(emisor)}`);

        if (!emisor.certificado || !emisor.clave_certificado) {
            return res.status(400).json({ error: 'El emisor no tiene un certificado asignado' });
        }

        const certificadoPath = path.join(__dirname, '../../documents/certificados/', emisor.certificado);
        console.log(`Ruta del certificado: ${certificadoPath}`);
        const pfx = fs.readFileSync(certificadoPath);

        const p12Asn1 = forge.asn1.fromDer(pfx.toString('binary'));
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, emisor.clave_certificado);

        const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
        const keyObj = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];

        if (!keyObj || !keyObj[0] || !keyObj[0].key) {
            return res.status(400).json({ error: 'No se pudo encontrar la clave privada en el certificado' });
        }

        const privateKey = keyObj[0].key;

        if (!privateKey.sign) {
            return res.status(500).json({ error: 'La clave privada no tiene el método sign.' });
        }

        const xmlContent = fs.readFileSync(path.resolve(rutaXML), 'utf8');
        const doc = new DOMParser().parseFromString(xmlContent, 'application/xml'); 

        const md = forge.md.sha256.create();
        md.update(xmlContent, 'utf8');

        const signature = privateKey.sign(md);
        const signatureBase64 = forge.util.encode64(signature);

        // Calcular el DigestValue aquí
        const digestValue = forge.util.encode64(forge.md.sha1.create().update(xmlContent).digest().getBytes());

        // Crear la estructura de firma
        const signatureNode = doc.createElementNS('http://www.w3.org/2000/09/xmldsig#', 'ds:Signature');
        signatureNode.setAttribute('Id', 'signatureKG'); // Agrega el atributo Id

        // Crear ds:SignedInfo
        const signedInfoNode = doc.createElementNS('http://www.w3.org/2000/09/xmldsig#', 'ds:SignedInfo');
        signedInfoNode.appendChild(doc.createElementNS('http://www.w3.org/2000/09/xmldsig#', 'ds:CanonicalizationMethod'));
        signedInfoNode.lastChild.setAttribute('Algorithm', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315#WithComments');
        signedInfoNode.appendChild(doc.createElementNS('http://www.w3.org/2000/09/xmldsig#', 'ds:SignatureMethod'));
        signedInfoNode.lastChild.setAttribute('Algorithm', 'http://www.w3.org/2000/09/xmldsig#dsa-sha1');
        
        const referenceNode = doc.createElementNS('http://www.w3.org/2000/09/xmldsig#', 'ds:Reference');
        referenceNode.setAttribute('URI', ''); // Completar según tu lógica
        const transformsNode = doc.createElementNS('http://www.w3.org/2000/09/xmldsig#', 'ds:Transforms');
        transformsNode.appendChild(doc.createElementNS('http://www.w3.org/2000/09/xmldsig#', 'ds:Transform'));
        transformsNode.lastChild.setAttribute('Algorithm', 'http://www.w3.org/2000/09/xmldsig#enveloped-signature');
        referenceNode.appendChild(transformsNode);
        referenceNode.appendChild(doc.createElementNS('http://www.w3.org/2000/09/xmldsig#', 'ds:DigestMethod'));
        referenceNode.lastChild.setAttribute('Algorithm', 'http://www.w3.org/2000/09/xmldsig#sha1');
        referenceNode.appendChild(doc.createElementNS('http://www.w3.org/2000/09/xmldsig#', 'ds:DigestValue'));
        referenceNode.lastChild.appendChild(doc.createTextNode(digestValue));
        signedInfoNode.appendChild(referenceNode);

        signatureNode.appendChild(signedInfoNode);

        // Crear ds:SignatureValue
        const signatureValueNode = doc.createElementNS('http://www.w3.org/2000/09/xmldsig#', 'ds:SignatureValue');
        signatureValueNode.appendChild(doc.createTextNode(signatureBase64));
        signatureNode.appendChild(signatureValueNode);

        // Crear ds:KeyInfo
        const keyInfoNode = doc.createElementNS('http://www.w3.org/2000/09/xmldsig#', 'ds:KeyInfo');
        const x509DataNode = doc.createElementNS('http://www.w3.org/2000/09/xmldsig#', 'ds:X509Data');
        const x509CertificateNode = doc.createElementNS('http://www.w3.org/2000/09/xmldsig#', 'ds:X509Certificate');
        x509CertificateNode.appendChild(doc.createTextNode(forge.util.encode64(emisor.certificado))); // Asegúrate de que este valor sea correcto
        x509DataNode.appendChild(x509CertificateNode);
        keyInfoNode.appendChild(x509DataNode);
        signatureNode.appendChild(keyInfoNode);

        // Insertar la firma en el XML
        const extensionContentNode = doc.getElementsByTagName('ext:ExtensionContent')[0];
        if (!extensionContentNode) {
            return res.status(400).json({ error: 'No se encontró la etiqueta <ext:ExtensionContent> en el XML' });
        }
        extensionContentNode.appendChild(signatureNode);

        // Serializar y formatear el XML
        const signedXML = new XMLSerializer().serializeToString(doc);
        const formattedXML = xmlFormatter(signedXML, { collapseContent: true }); // formatea el XML

        fs.writeFileSync(path.resolve(rutaXML), formattedXML); // guarda el XML formateado

        res.json({ message: 'XML firmado correctamente', ruta: rutaXML });
    } catch (error) {
        console.error('Error al firmar el XML:', error);
        res.status(500).json({ error: 'Error al firmar el XML' });
    }
};




// PASO 03: ZIPAR EL XML:
// Utiliza la librería adm-zip para comprimir el XML firmado:
exports.comprimirXML = async (req, res) => {
    try {
        const { rutaXML } = req.body;
        const nombreZIP = path.basename(rutaXML).replace('.xml', '.zip');
        const zipFile = new zip();
        
        // Comprimir el XML
        zipFile.addLocalFile(path.resolve(rutaXML));
        const zipPath = path.join(__dirname, '../../documents/zip/', nombreZIP);
        zipFile.writeZip(zipPath);

        // Leer el archivo ZIP y convertirlo a base64
        const zipData = fs.readFileSync(zipPath);
        const zipBase64 = zipData.toString('base64');

        res.json({
            message: 'Archivo comprimido y convertido a base64 correctamente',
            zipBase64: zipBase64
        });
    } catch (error) {
        console.error('Error al comprimir el XML:', error);
        res.status(500).json({ error: 'Error al comprimir el XML' });
    }
};

// PASO 04 con 05: PREPARAMOS LA CARTA DE ENVIO para SUNAT:
// Usa axios para enviar el comprobante a la API de SUNAT:
exports.enviarASunat = async (req, res) => {
    try {
        const { nombreZIP } = req.body;
        const zipPath = path.resolve(__dirname, '../../documents/zip/', nombreZIP);
        let zipContent;

        if (fs.existsSync(zipPath)) {
            zipContent = fs.readFileSync(zipPath).toString('base64');
            
            // Verificar la integridad del archivo ZIP
            const hash = crypto.createHash('sha256');
            hash.update(fs.readFileSync(zipPath));
            const digest = hash.digest('hex');
            console.log('Digest del archivo ZIP:', digest);
        } else {
            console.error('El archivo no existe:', zipPath);
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }
        
        const emisor = await Emisor.findOne();

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

        const response = await axios.post('https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService', xmlEnvio, {
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'Accept': 'text/xml',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'SOAPAction': '',
                'Content-Length': xmlEnvio.length
            }
        });

        // Manejar la respuesta
        res.json({ response: response.data });
    } catch (error) {
        console.error('Error al enviar a SUNAT:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error al enviar a SUNAT' });
    }
};

// PASO 06: LEER LA RESPUESTA DE SUNAT.
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
