{
    "name": "iot_base",
    "summary": "IoT Base",
    "author": "Ricardo Perez (ric98esley)",
    "website": "https://github.com/ric98esley/odoo_iot",
    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/15.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    "category": "IoT",
    "version": "18.0.0.0.1",
    # any module necessary for this one to work correctly
    "depends": ["base"],
    # always loaded
    "data": [],
    # only loaded in demonstration mode
    "demo": [
        "demo/demo.xml",
    ],
    "license": "AGPL-3",
}
