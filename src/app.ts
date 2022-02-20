// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2022 Roland Csaszar
//
// Project:  typescript-test
// File:     app.ts
// Date:     20.Feb.2022
//
// ==============================================================================

// Turn this into an module file.
export { testApp };

import i18next from "i18next";

i18next.init({
    // eslint-disable-next-line i18next/no-literal-string
    lng: "en",
    debug: true,
});

function testApp() {
    // eslint-disable-next-line no-console
    console.log(i18next.t("halloText"));
}

testApp();
