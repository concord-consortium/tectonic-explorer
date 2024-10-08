import { configure } from "@testing-library/react";

// Cypress tests depend on data-test attribute already, so let's reuse it in Jest tests (React Testing library).
configure({ testIdAttribute: "data-test" });
