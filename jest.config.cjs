module.exports = {
    testEnvironment: "jsdom",
    testMatch: ["<rootDir>/src/main/resources/static/js/__tests__/**/*.test.js"],
    collectCoverage: true,
    collectCoverageFrom: ["src/main/resources/static/js/catalog.js"],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    }
};
