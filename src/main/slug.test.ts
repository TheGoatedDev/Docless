import assert from "node:assert/strict";
import { test } from "node:test";
import { pickDest, slugStem } from "./slug.ts";

test("slugStem lowercases and hyphenates", () => {
    assert.equal(slugStem("Invoice Acme 2026"), "invoice-acme-2026");
});

test("slugStem strips quotes and extension", () => {
    assert.equal(slugStem('"Invoice.pdf"'), "invoice");
});

test("slugStem uses first non-empty line", () => {
    assert.equal(slugStem("\nFoo Bar\nbaz"), "foo-bar");
});

test("slugStem empty garbage", () => {
    assert.equal(slugStem("..."), "");
    assert.equal(slugStem(""), "");
});

test("slugStem caps at 80 and no trailing hyphen", () => {
    const s = slugStem(`${"A".repeat(90)}-`);
    assert.equal(s.length, 80);
    assert.ok(!s.endsWith("-"));
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
