import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

global.fdescribe = (...args) => describe.only(...args);
global.fit = (...args) => it.only(...args);
global.expect = expect;
