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

        // Crear el objeto XML con los datos del comprobante
        const xmlData = {
            'Invoice': {
                '@_xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
                '@_xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
                '@_xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
                '@_xmlns:ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
                '@_xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
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
                    '#text': '0101' // Código de tipo de Operación | catálogo 51 es venta interna
                },
                'cbc:ID': `${venta.serie}-${venta.correlativo}`,
                'cbc:IssueDate': venta.fecha_emision,
                'cbc:IssueTime': '00:00:00',
                'cbc:DueDate': venta.fecha_emision,
                'cbc:InvoiceTypeCode': '01', // Tipo de documento: Factura
                'cbc:DocumentCurrencyCode': 'PEN', // Moneda
                'cac:AccountingSupplierParty': {
                    'cbc:CustomerAssignedAccountID': venta.Emisor.ruc,
                    'cbc:AdditionalAccountID': '6', // Tipo de documento del emisor: RUC
                    'cac:Party': {
                        'cac:PartyLegalEntity': {
                            'cbc:RegistrationName': venta.Emisor.razon_social,
                            'cac:RegistrationAddress': {
                                'cbc:ID': venta.Emisor.Direccion.ubigueo,
                                'cbc:AddressTypeCode': '0000',
                                'cbc:CitySubdivisionName': venta.Emisor.Direccion.urbanizacion,
                                'cbc:CityName': venta.Emisor.Direccion.provincia,
                                'cbc:CountrySubentity': venta.Emisor.Direccion.departamento,
                                'cbc:District': venta.Emisor.Direccion.distrito,
                                'cac:AddressLine': {
                                    'cbc:Line': venta.Emisor.Direccion.direccion
                                },
                                'cac:Country': {
                                    'cbc:IdentificationCode': 'PE'
                                }
                            }
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
                        'cbc:TaxAmount': {
                            '@_currencyID': 'PEN',
                            '#text': venta.total_impuestos
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
