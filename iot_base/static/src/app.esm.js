import {mountComponent} from "@web/env";
import {Root} from "./root.esm";
import {whenReady} from "@odoo/owl";

whenReady(() => mountComponent(Root, document.body));
