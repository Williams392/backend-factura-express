// controllers/FacturacionController.js.

const forge = require('node-forge');
const zip = require('adm-zip');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// PASO 02: FIRMAR EL XML
exports.firmarXML = async (req, res) => {
    try {
        const { rutaXML } = req.body; // Ruta del XML generado
        const emisor = await Emisor.findOne();
        const certificadoPath = path.join(__dirname, '../../documents/certificados/CERTIFICADO-DEMO-20353745421.pfx');
        const pfx = fs.readFileSync(certificadoPath);
        const p12Asn1 = forge.asn1.fromDer(pfx.toString('binary'));
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, emisor.clave_certificado);

        const keyObj = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag];
        const privateKey = keyObj.key;

        // Leer el contenido del XML
        const xmlContent = fs.readFileSync(rutaXML, 'utf8');
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
        const extensionContentNode = doc.getElementsByTagName('ext:ExtensionContent');
        extensionContentNode.appendChild(signatureNode);

        // Serializar el XML de vuelta a una cadena
        const signedXML = new XMLSerializer().serializeToString(doc);

        // Guardar el XML firmado
        fs.writeFileSync(rutaXML, signedXML);

        res.json({ message: 'XML firmado correctamente', ruta: rutaXML });
    } catch (error) {
        console.error(error);
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
    zipFile.writeZip(`./documents/zip/${nombreZIP}`);
    res.json({ message: 'Archivo comprimido correctamente', zip: nombreZIP });
};


// PASO 04 con 05: PREPARAMOS LA CARTA DE ENVIO para SUNAT:
// Usa axios para enviar el comprobante a la API de SUNAT:
exports.enviarASunat = async (req, res) => {
    const { nombreZIP } = req.body;
    const zipContent = fs.readFileSync(`./documents/zip/${nombreZIP}`).toString('base64');

    const xmlEnvio = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
            <ser:sendBill>
                <fileName>${nombreZIP}</fileName>
                <contentFile>${zipContent}</contentFile>
            </ser:sendBill>
        </soapenv:Body>
    </soapenv:Envelope>`;

    const response = await axios.post('https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService', xmlEnvio, {
        headers: {
            'Content-Type': 'text/xml'
        }
    });

    // Manejar la respuesta
    res.json({ response: response.data });
};


// PASO 06: LEER LA RESPUESTA DE SUNAT.
exports.leerRespuestaSunat = async (req, res) => {
    const { nombreZIP } = req.body;
    const rutaCDR = `./documents/cdr/R-${nombreZIP}`;
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
                zip.extractAllTo(`./documents/cdr/R-${nombreZIP.replace('.zip', '')}`, true);
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
