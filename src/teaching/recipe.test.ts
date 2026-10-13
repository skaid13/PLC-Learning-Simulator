import { expect, it } from 'vitest';
import { createReferenceProgram } from '../data/referencePrograms';
import { experiments } from '../data/experiments';
import { cloneNetwork } from '../editor/model';
import { recipeMatches } from './recipe';

it('逐网络对照忽略随机标识，但识别遗漏、错序、参数和多余空支路', () => {
  const recipe = createReferenceProgram(experiments[0]);
  const student = { ...recipe, networks: recipe.networks.map(cloneNetwork) };
  expect(recipeMatches(student, recipe).every(Boolean)).toBe(true);
  const changed = structuredClone(student);
  changed.networks[0].coil!.operation = 'coil';
  changed.networks[1].coil!.preset = 500;
  changed.networks[2].branches = [[]];
  [changed.networks[3], changed.networks[4]] = [changed.networks[4], changed.networks[3]];
  const matches = recipeMatches(changed, recipe);
  expect(matches.slice(0, 5)).toEqual([false, false, false, false, false]);
  expect(matches.slice(5).every(Boolean)).toBe(true);
  expect(recipeMatches({ ...student, networks: [] }, recipe).some(Boolean)).toBe(false);
});
