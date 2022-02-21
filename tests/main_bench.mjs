// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2022 Roland Csaszar
//
// Project:  TypeScript-PWA-Template
// File:     main_bench.mjs
// Date:     21.Feb.2022
//
// ==============================================================================

/* eslint-disable chai-friendly/no-unused-expressions */
/* eslint-disable i18next/no-literal-string */

import * as b from "benny";

b.suite(
    `Test Benchmarks`,
    b.add("Concat every letter", () => {
        String(
            "W" +
                "h" +
                "a" +
                "t " +
                " i" +
                "s " +
                "f" +
                "a" +
                "s" +
                "t" +
                "e" +
                "r" +
                "?"
        );
    }),
    b.add("Use the concat function", () => {
        let text = "what";
        text.concat(" is ").concat("faster?");
    }),
    b.add("Just the string", () => {
        "What is faster?";
    }),
    b.cycle(),
    b.complete()
);
