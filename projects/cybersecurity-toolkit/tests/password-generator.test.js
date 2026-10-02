"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const api = require("../js/password-generator.js");

const groups = Object.keys(api.CHARSETS);

test("genera la longitud pedida y usa solo caracteres permitidos", () => {
  const config = {
    length: 20,
    groups,
    excludeAmbiguous: false,
  };

  const settings = api.getSettings(config);
  const password = api.generatePassword(config, webcrypto);

  assert.equal(password.length, 20);
  assert.ok([...password].every((char) => settings.alphabet.includes(char)));
});

test("incluye al menos un carácter de cada tipo seleccionado", () => {
  const config = {
    length: 16,
    groups: ["uppercase", "lowercase", "numbers", "symbols"],
    excludeAmbiguous: false,
  };

  const settings = api.getSettings(config);
  const password = api.generatePassword(config, webcrypto);

  for (const group of settings.groups) {
    assert.ok([...password].some((char) => group.includes(char)));
  }
});

test("puede excluir caracteres parecidos", () => {
  const password = api.generatePassword(
    {
      length: 64,
      groups,
      excludeAmbiguous: true,
    },
    webcrypto,
  );

  assert.ok(!/[O0Il1|]/.test(password));
});

test("rechaza configuraciones que no son válidas", () => {
  assert.throws(
    () => api.generatePassword({ length: 7, groups: ["numbers"] }, webcrypto),
    /longitud/,
  );

  assert.throws(
    () => api.generatePassword({ length: 20, groups: [] }, webcrypto),
    /Selecciona/,
  );
});
