import assert from "node:assert/strict";
import { test } from "node:test";
import {
    assembleStem,
    dateFromMs,
    hyphenate,
    parseDate,
    parseNameFields,
    pickDest,
} from "./slug.ts";

test("hyphenate keeps case, spaces to hyphens", () => {
    assert.equal(hyphenate("Acme Corp"), "Acme-Corp");
    assert.equal(hyphenate("Q3 Invoice"), "Q3-Invoice");
});

test("hyphenate strips illegal fs chars", () => {
    assert.equal(hyphenate('Acme/Corp: "Inc"'), "Acme-Corp-Inc");
});

test("hyphenate empty garbage", () => {
    assert.equal(hyphenate("..."), "...");
    assert.equal(hyphenate(""), "");
    assert.equal(hyphenate("///"), "");
});

test("parseDate accepts YYYY-MM-DD", () => {
    assert.equal(parseDate("2026-03-15"), "2026-03-15");
    assert.equal(parseDate("NONE"), null);
    assert.equal(parseDate("15/03/2026"), null);
    assert.equal(parseDate("2026-13-01"), null);
});

test("dateFromMs local calendar day", () => {
    assert.equal(dateFromMs(new Date(2026, 2, 15).getTime()), "2026-03-15");
});

test("parseNameFields three lines", () => {
    const p = parseNameFields(
        "DATE: 2026-03-15\nVENDOR: Acme Corp\nWHAT: Q3 Invoice",
    );
    assert.deepEqual(p, {
        date: "2026-03-15",
        vendor: "Acme Corp",
        what: "Q3 Invoice",
    });
});

test("parseNameFields NONE and extra chatter", () => {
    const p = parseNameFields(
        "Sure.\nDATE: NONE\nVENDOR: NONE\nWHAT: Scanned letter",
    );
    assert.deepEqual(p, { date: null, vendor: "", what: "Scanned letter" });
});

test("assembleStem partial", () => {
    assert.equal(
        assembleStem("2026-03-15", "Acme Corp", "Q3 Invoice"),
        "2026-03-15-Acme-Corp-Q3-Invoice",
    );
    assert.equal(assembleStem(null, "Acme", "Invoice"), "Acme-Invoice");
    assert.equal(assembleStem("2026-03-15", "", ""), "2026-03-15");
    assert.equal(assembleStem(null, "", ""), "");
});

test("pickDest first free name", () => {
    assert.equal(
        pickDest(".", "a", ".pdf", () => false),
        "a.pdf",
    );
});

test("pickDest suffixes on collision", () => {
    const taken = new Set(["inv/a.pdf", "inv/a-2.pdf"]);
    assert.equal(
        pickDest("inv", "a", ".pdf", (r) => taken.has(r)),
        "inv/a-3.pdf",
    );
});

test("pickDest null at 99", () => {
    assert.equal(
        pickDest(".", "a", ".pdf", () => true),
        null,
    );
});
