<?php

# EMISOR - COMPROBANTE deben de venir de una base de datos:
# =========================================================
# 1. RUC
# 2. RAZON SOCIAL
# 3. NOMBRE COMERCIAL
# 4. DIRECCION
# 5. USUARIO SOL
# 6. CLAVE SOL
# 7. CERTIFICADO

$carpetaxml = 'xml/'; # carpeta donde se guardara el xml
$carpetacdr = 'cdr/'; # carpeta donde se guardara lo que sunat responde.


# Es la empresa, institutcion, etc:
$emisor = array (
    'ruc' => '20607599727',
    'razon_social' => 'INSITITUTO INTERNACIONAL DE SOFTWARE S.A.C.',
    'direccion' => '8 DE OCTUBRE N 123 - LAMBAYEQUE - ETC'
    'usuario_emisor' => '20607599727INSITITUTO', # obtener de sunat prueba# 
    'clave_emisor' => '12345678', # obtener de sunat prueba
    
    'certificado' => 'C:\xampp\htdocs\facturacion\certificado\certificado.pfx',
    'clave_certificado' => '12345678',
    'tipo_certificado' => '1',
    'tipo_emision' => '1',
);


$comprobante = array(
    'tipo' => '01',
    'serie' => 'F001',
    'correlativo' => '123',
    'fecha_emision' => '2021-03-01',
    'numero' => '1',
);

# hace el comprobante que venga de cualquier empresa se arma dinamicamente.
$nombrexml = $carpetaxml . $emisor['ruc'] . '-' . $comprobante['tipo'] . '-' . $comprobante['serie'] . '-' . $comprobante['correlativo'];


# la estructura del xml
$xml = '
<?xml version="1.0" encoding="utf-8"?>

<Invoice xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ccts="urn:un:unece:uncefact:documentation:2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2" xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2" xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
	
	<ext:UBLExtensions>
		<ext:UBLExtension>
			<ext:ExtensionContent/>  <!-- esta etiqueta contiene la firma digital-->
		</ext:UBLExtension>
	</ext:UBLExtensions>

	<cbc:UBLVersionID>2.1</cbc:UBLVersionID> <!-- fijo-->
	<cbc:CustomizationID schemeAgencyName="PE:SUNAT">2.0</cbc:CustomizationID> <!-- fijo-->
	<cbc:ProfileID schemeName="Tipo de Operacion" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo51">0101</cbc:ProfileID> <!-- Codigo de tipo de Operacion | catalogo 51 es venta interna -->
	<cbc:ID>'.$comprobante['serie'].'0'.$comprobante['correlativo'].'</cbc:ID>  <!-- concatenar-->
	<cbc:IssueDate>'.$comprobante['fecha_emision'].'</cbc:IssueDate> 
	<cbc:IssueTime>00:00:00</cbc:IssueTime>
	<cbc:DueDate>'.$comprobante['fecha_emision'].'</cbc:DueDate> <!-- concatenar-->
	<cbc:InvoiceTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01" listID="0101" name="Tipo de Operacion">01</cbc:InvoiceTypeCode>
	<cbc:DocumentCurrencyCode listID="ISO 4217 Alpha" listName="Currency" listAgencyName="United Nations Economic Commission for Europe">PEN</cbc:DocumentCurrencyCode>
            <cbc:LineCountNumeric>7</cbc:LineCountNumeric>
'; 


// PASO 01: GENERAR EL XML
$doc = new DOMDocument();
$doc->formatOutput = FALSE;
$doc->preserveWhiteSpace = TRUE;
$doc->encoding = 'utf-8';

$doc->loadXML($xml);
$doc->save($carpetaxml.$nombrexml.'.XML'); # cargar y guardar el documento. Pero se debe de crear 2 carpetas en la raiz del proyecto uno xml y cdr(cuando sunat responde)
# Resumen: Crea el archivo XML con la estructura de la factura, que será enviado a SUNAT.



// PASO 02: FIRMAR EL XML  - https://llama.pe/certificado-digital-de-prueba-sunat - (01:44:00)
require_once 'signature.php';
$objSignature = new Signature(); # se requiere una libreria PHP api para crear un objeto asignature

$flg_firma = "0";
$rutaxml = $carpetaxml.$nombrexml.'.XML';

$ruta_firma = 'certificado_prueba.pfx'; # por la pagina
$pass_firma = 'institutoisi'; # contraseña

$resp = $objSignature->signature_xml($flg_firma, $rutaxml, $ruta_firma, $pass_firma); # signature_xml -> es de la libreria
 # Resumen: Se utiliza una librería externa (Signature) para firmar el XML con un certificado digital.


 
// PASO 03: ZIPAR EL XML - (02:13:00)
$zip = new ZipArchive();

$nombrezip = $nombrexml.'.ZIP';
$rutazip = $carpetaxml.$nombrezip.'.ZIP';
if($zip->open($rutazip, ZIPARCHIVE::CREATE)===true) {
    $zip->addFile($ruta, $nombrexml.'.XML');
    $zip->close();
}
# Resumen: Se genera un archivo ZIP que contiene el XML firmado.


// PASO 04: PREPARAMOS LA CARTA DE ENVIO para SUNAT - el zip que emos creado - (02:19:00)
# Envio ws sunat con php.
$contenido_del_zip = base64_encode(file_get_contents($rutazip));
$xml_envio = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/
    envelope/" xmlns:ser="http://service.sunat.gob.pe" 
    xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/
    oasis-200401-wss-wssecurity-secext-1.0.xsd">
<soapenv:Header>
      <wsse:Security>
         <wsse:UsernameToken>
            <wsse:Username>'.$emisor['ruc'].$emisor['usuario_emisor'].'</wsse:Username>
            <wsse:Password>'.$emisor['clave_emisor'].'</wsse:Password>
         </wsse:UsernameToken>
      </wsse:Security>
</soapenv:Header>
<soapenv:Body>
    <ser:sendBill>
        <fileName>'.$nombrezip.'</fileName>
        <contentFile>'.$contenido_del_zip.'</contentFile>
    </ser:sendBill>
</soapenv:Body>
</soapenv:Envelope>';
# Resumen: Se estructura el mensaje SOAP que contendrá el ZIP a ser enviado a 
# través del servicio web de SUNAT.


// PASO 05: ENVIAMOS EL COMPROBANTE DE WEB SERVICE DE SUNAT (02:27:00)
# CARCET.PERM -> en caso no se pueda hacer peticiones HTTPS desde mi computadora local.
$ws = "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService";
$header = array( # configuraciones de la cabecera
    "Content-type: text/xml; charset=\"utf-8\"",
    "Accept: text/xml",
    "Cache-Control: no-cache",
    "Pragma: no-cache",
    "SOAPAction: ",
    "Content-lenght: " . strlen($xml_envio)
);

$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 1); # verificaciones del ssl q es 1
curl_setopt($ch, CURLOPT_URL, $ws); # el url de web service
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); 
curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_ANY);
curl_setopt($ch, CURLOPT_TIMEOUT, 30); # tiempo de peticion 30 segundos
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $xml_envio); # los datos q estoy enviando
curl_setopt($ch, CURLOPT_HTTPHEADER, $header); # configuracion de la cabecera
curl_setopt($ch, CURLOPT_CAINFO, dirname(__FILE__) . "/cacert.pem"); # -> en caso hay problemas de hacer peticiones

$response = curl_exec($ch);
curl_close($ch);
# Resumen: Realiza la conexión con el servicio web de SUNAT y envía 
# el comprobante comprimido para su validación.


// PASO 06: LEER LA RESPUESTA DE SUNAT: (02:33:00)
# sunat tanbien envia lo mismo el cdr en base64_encode y aca lo decodificamos.
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
if($httpcode == 200){
    $doc = new DOMDocument();
    $doc->loadXML($response);
    if(isset($doc->getElementsByTagName('applicationResponse')->item(0)->nodeValue)){ # verifica si tenemos el CDR(adentro esta la carta de envio)
        $cdr = $doc->getElementsByTagName('applicationResponse')->item(0)->nodeValue; # obtener el valor de esta etiqueta con getElementsByTagName.
        $cdr = base64_decode($cdr); 
        file_put_contents($carpetacdr."R-" . $nombrezip, $cdr); # guardamos en la carpetacdr
        $zip = new ZipArchive;
        if($zip->open($carpetacdr."R-" . $nombrezip) === true){ # extraer el zip
            $zip->extractTo($carpetacdr."R-" . $nombrexml);
            $zip->close();
        }
        echo "FACTURA ENVIADA CORRECTAMENTE";
    } else {
        $codigo = $doc->getElementsByTagName("faultcode")->item(0)->nodeValue; # En caso no recibimos el CDR
        $mensaje = $doc->getElementsByTagName("faultstring")->item(0)->nodeValue;
        echo "error " . $codigo . ": " . $mensaje;
    }
} else {
    echo curl_error($ch);
    echo "Problema de conexión";
}

curl_close($ch);
# Reusmen: Se lee la respuesta de SUNAT. Si es exitosa, guarda y extrae el archivo de 
# respuesta (CDR); si no, muestra un mensaje de error detallado.


?>