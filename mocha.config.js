import { expect } from 'chai';

global.fdescribe = (...args) => describe.only(...args);
global.fit = (...args) => it.only(...args);
global.expect = expect;
