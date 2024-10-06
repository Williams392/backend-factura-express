// src/controllers/Factura/xmlController.js
const Emisor = require('../../models/Emisor');
const Cliente = require('../../models/Cliente');
const Venta = require('../../models/Venta');
const DetalleVenta = require('../../models/DetalleVenta');
const Leyenda = require('../../models/Leyenda');
const Direccion = require('../../models/Direccion');
const fs = require('fs');
const { XMLBuilder } = require('fast-xml-parser');
const path = require('path');
const moment = require('moment');

exports.generarFacturaXML = async (req, res) => {
    try {
        const venta = await Venta.findByPk(req.params.id, {
            include: [
                { model: Emisor, include: [Direccion] },
                Cliente,
                { model: DetalleVenta, as: 'DetalleVentas' },
                { model: Leyenda, as: 'Leyendas' }
            ]
        });

        if (!venta) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        const nombreXML = `${venta.emisor_ruc}-${venta.tipo}-${venta.serie}-${venta.correlativo}`;
        const rutaXML = path.join(__dirname, '../../documents/xml/', `${nombreXML}.xml`);

        // Crear el directorio si no existe
        const dir = path.dirname(rutaXML);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Configuración del fast-xml-parser
        const options = {
            ignoreAttributes: false,
            format: true
        };

        // Formatear las fechas y horas
        const issueDate = moment(venta.fecha_emision).format('YYYY-MM-DD');
        const issueTime = moment(venta.hora_emision, 'HH:mm:ss').format('HH:mm:ss');
        const dueDate = moment(venta.fecha_vencimiento).format('YYYY-MM-DD');

        // Crear el objeto XML con los datos del comprobante
        const xmlData = {

            '?xml': {
                '@_version': '1.0',
                '@_encoding': 'utf-8'
            },

            'Invoice': {
                '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                '@_xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
                '@_xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
                '@_xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
                '@_xmlns:ccts': 'urn:un:unece:uncefact:documentation:2',
                '@_xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
                '@_xmlns:ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
                '@_xmlns:qdt': 'urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2',
                '@_xmlns:udt': 'urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2',
                '@_xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',

                'ext:UBLExtensions': {
                    'ext:UBLExtension': {
                        'ext:ExtensionContent': '' // Aquí se incluirá la firma digital
                    }
                },

                'cbc:UBLVersionID': '2.1',
                'cbc:CustomizationID': {
                    '@_schemeAgencyName': 'PE:SUNAT',
                    '#text': '2.0'
                },
                'cbc:ProfileID': {
                    '@_schemeName': 'Tipo de Operacion',
                    '@_schemeAgencyName': 'PE:SUNAT',
                    '@_schemeURI': 'urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo51',
                    '#text': '01' // Código de tipo de Operación | catálogo 51 es venta interna
                },
                'cbc:ID': `${venta.serie}-${venta.correlativo}`,
                'cbc:IssueDate': issueDate,
                'cbc:IssueTime': issueTime,
                'cbc:DueDate': dueDate,
                
                //'cbc:InvoiceTypeCode': '01', // Tipo de documento: Factura
                'cbc:InvoiceTypeCode': {
                    '@_listAgencyName': 'PE:SUNAT',
                    '@_listName': 'Tipo de Documento',
                    '@_listURI': 'urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01',
                    '@_listID': '0101',
                    '@_name': 'Tipo de Operacion',
                    '#text': '01'  // Código de tipo de documento (Factura)
                },

                //'cbc:DocumentCurrencyCode': 'PEN', // Moneda
                'cbc:DocumentCurrencyCode': {
                    '@_listID': 'ISO 4217 Alpha',
                    '@_listName': 'Currency',
                    '@_listAgencyName': 'United Nations Economic Commission for Europe',
                    '#text': 'PEN'  // Código de moneda
                },
                'cbc:LineCountNumeric': venta.DetalleVentas.length,  // Cantidad de líneas de detalle

                // Nuevo:
                'cac:Signature': {
                    'cbc:ID': `${venta.serie}-${venta.correlativo}`,  // ID de la firma
                    'cac:SignatoryParty': {
                        'cac:PartyIdentification': {
                            'cbc:ID': venta.Emisor.ruc  // RUC del emisor
                        },
                        'cac:PartyName': {
                            'cbc:Name': `<![CDATA[${venta.Emisor.nombre_comercial}]]>`  // Nombre comercial del emisor
                        }
                    },
                    'cac:DigitalSignatureAttachment': {
                        'cac:ExternalReference': {
                            'cbc:URI': '#SignatureSP'  // URI de la firma
                        }
                    }
                },


                'cac:AccountingSupplierParty': {
                    'cac:Party': {
                        'cac:PartyIdentification': {
                            'cbc:ID': {
                                '@_schemeID': '6',
                                '@_schemeName': 'Documento de Identidad',
                                '@_schemeAgencyName': 'PE:SUNAT',
                                '@_schemeURI': 'urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06',
                                '#text': venta.Emisor.ruc
                            }
                        },
                        'cac:PartyName': {
                            'cbc:Name': venta.Emisor.razon_social,
                        },
                        'cac:PartyTaxScheme': {
                            'cbc:RegistrationName': venta.Emisor.razon_social,
                            'cbc:CompanyID': {
                                '@_schemeID': '6',
                                '@_schemeName': 'SUNAT:Identificador de Documento de Identidad',
                                '@_schemeAgencyName': 'PE:SUNAT',
                                '@_schemeURI': 'urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06',
                                '#text': venta.Emisor.ruc
                            },
                            'cac:TaxScheme': {
                                'cbc:ID': {
                                    '@_schemeID': '6',
                                    '@_schemeName': 'SUNAT:Identificador de Documento de Identidad',
                                    '@_schemeAgencyName': 'PE:SUNAT',
                                    '@_schemeURI': 'urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06',
                                    '#text': venta.Emisor.ruc
                                }
                            }
                        },
                        'cac:PartyLegalEntity': {
                            'cbc:RegistrationName': venta.Emisor.razon_social,
                            'cac:RegistrationAddress': {
                                'cbc:ID': {
                                    '@_schemeName': 'Ubigeos',
                                    '@_schemeAgencyName': 'PE:INEI',
                                    '#text': venta.Emisor.Direccion.ubigueo
                                },
                                'cbc:AddressTypeCode': {
                                    '@_listAgencyName': 'PE:SUNAT',
                                    '@_listName': 'Establecimientos anexos',
                                    '#text': '0000'
                                },
                                'cbc:CityName': venta.Emisor.Direccion.provincia,
                                'cbc:CountrySubentity': venta.Emisor.Direccion.departamento,
                                'cbc:District': venta.Emisor.Direccion.distrito,
                                'cac:AddressLine': {
                                    'cbc:Line': venta.Emisor.Direccion.direccion,
                                },
                                'cac:Country': {
                                    'cbc:IdentificationCode': {
                                        '@_listID': 'ISO 3166-1',
                                        '@_listAgencyName': 'United Nations Economic Commission for Europe',
                                        '@_listName': 'Country',
                                        '#text': 'PE'
                                    }
                                }
                            }
                        },
                        'cac:Contact': {
                            'cbc:Name': `CDATA[Nombre de Contacto` // Asegúrate de que este campo no esté vacío
                        }
                    }
                },

                'cac:AccountingCustomerParty': {
                    'cbc:CustomerAssignedAccountID': venta.Cliente.num_doc,
                    'cbc:AdditionalAccountID': venta.Cliente.tipo_doc, // Tipo de documento del cliente
                    'cac:Party': {
                        'cac:PartyLegalEntity': {
                            'cbc:RegistrationName': venta.Cliente.razon_social
                        }
                    }
                },
                'cac:TaxTotal': {
                    'cbc:TaxAmount': {
                        '@_currencyID': 'PEN',
                        '#text': venta.total_impuestos
                    },
                    'cac:TaxSubtotal': {
                        'cbc:TaxableAmount': {
                            '@_currencyID': 'PEN',
                            '#text': venta.total_venta
                        },
                        'cbc:TaxAmount': {
                            '@_currencyID': 'PEN',
                            '#text': venta.total_impuestos
                        },
                        'cac:TaxCategory': {
                            'cbc:ID': {
                                '@_schemeID': 'UN/ECE 5305',
                                '@_schemeName': 'Tax Category Identifier',
                                '@_schemeAgencyName': 'United Nations Economic Commission for Europe',
                                '#text': 'S'
                            },
                            'cac:TaxScheme': {
                                'cbc:ID': {
                                    '@_schemeID': 'UN/ECE 5153',
                                    '@_schemeAgencyID': '6',
                                    '#text': '1000'
                                },
                                'cbc:Name': 'IGV',
                                'cbc:TaxTypeCode': 'VAT'
                            }
                        }
                    }
                },
                'cac:LegalMonetaryTotal': {
                    'cbc:PayableAmount': {
                        '@_currencyID': 'PEN',
                        '#text': venta.total
                    }
                },
                'cac:InvoiceLine': (venta.DetalleVentas || []).map(item => ({
                    'cbc:ID': item.id,
                    'cbc:InvoicedQuantity': {
                        '@_unitCode': item.unidad,
                        '#text': item.cantidad
                    },
                    'cbc:LineExtensionAmount': {
                        '@_currencyID': 'PEN',
                        '#text': item.valor_venta
                    },
                    'cac:PricingReference': {
                        'cac:AlternativeConditionPrice': {
                            'cbc:PriceAmount': {
                                '@_currencyID': 'PEN',
                                '#text': item.precio_unitario
                            },
                            'cbc:PriceTypeCode': '01' // Precio unitario
                        }
                    },
                    'cac:TaxTotal': {
                        'cbc:TaxAmount': {
                            '@_currencyID': 'PEN',
                            '#text': item.total_impuestos
                        },
                        'cac:TaxSubtotal': {
                            'cbc:TaxAmount': {
                                '@_currencyID': 'PEN',
                                '#text': item.total_impuestos
                            },
                            'cac:TaxCategory': {
                                'cac:TaxScheme': {
                                    'cbc:ID': '1000',
                                    'cbc:Name': 'IGV',
                                    'cbc:TaxTypeCode': 'VAT'
                                }
                            }
                        }
                    },
                    'cac:Item': {
                        'cbc:Description': item.descripcion
                    },
                    'cac:Price': {
                        'cbc:PriceAmount': {
                            '@_currencyID': 'PEN',
                            '#text': item.valor_unitario
                        }
                    }
                })),
                'cac:UBLExtensions': {
                    'cac:UBLExtension': {
                        'cbc:ExtensionContent': {
                            'cbc:AdditionalInformation': (venta.Leyendas || []).map(leyenda => ({
                                'cbc:AdditionalMonetaryTotal': {
                                    'cbc:ID': leyenda.codigo,
                                    'cbc:PayableAmount': {
                                        '@_currencyID': 'PEN',
                                        '#text': leyenda.valor
                                    }
                                }
                            }))
                        }
                    }
                }
            }
        };

        const builder = new XMLBuilder(options);
        const xml = builder.build(xmlData);

        // Guardar XML
        fs.writeFileSync(rutaXML, xml);

        res.json({ message: 'XML generado correctamente', ruta: rutaXML });
    } catch (error) {
        console.error('Error al generar el XML:', error);
        res.status(500).json({ error: 'Error al generar XML', details: error.message });
    }
};
