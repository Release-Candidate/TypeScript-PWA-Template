// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2022 Roland Csaszar
//
// Project:  typescript-test
// File:     main_tests.ts
// Date:     20.Feb.2022
//
// ==============================================================================
/*eslint no-magic-numbers: ["error", { "ignore": [46] }]*/
/* eslint-disable i18next/no-literal-string */

import * as fc from "fast-check";
import { expect } from "chai";
import { testApp } from "../src/app";

describe("Testing tests!", () => {
    it("First Test", () => {
        const bla = false;
        expect(bla).to.be.false;
    });
    it("Second Test", () => {
        const hugo = null;
        expect(hugo).to.be.undefined;
    });
    it("Third Test", () => {
        const foo = 42;
        testApp();
        expect(foo).to.equal(46);
    });

    it("Property testing!", function () {
        fc.assert(
            fc.property(fc.integer(), (i) => i < 46),
            { verbose: true }
        );
    });
});
