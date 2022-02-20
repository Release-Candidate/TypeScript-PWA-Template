/* eslint-disable no-undef */
module.exports = {
    content: ["./src/**/*.ts", "./assets/*.html"],
    theme: {
        container: {
            center: true,
            padding: "2rem",
        },
        extend: {
            height: {
                "fit-content": "fit-content",
            },
            spacing: {
                128: "32rem",
                136: "34rem",
                144: "36rem",
                152: "38rem",
                160: "40rem",
                168: "42rem",
            },
        },
    },
    extend: {},

    darkMode: "media",

    plugins: [require("@tailwindcss/forms")],
};
