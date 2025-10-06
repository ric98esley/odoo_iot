import {whenReady} from "@odoo/owl";
import {mountComponent} from "@web/env";
import {Root} from "./root.esm";

whenReady(() => mountComponent(Root, document.body));
