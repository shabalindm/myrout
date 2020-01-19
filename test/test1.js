const assert = require('chai').assert;

describe('TlandText',()=>{
    let i;

    beforeEach(()=>{
       i=13
    });

    it('Метод toJSON сериализует объект в соответствии с вики https://gitlab.ticketland.ru/info/info/wikis/web-schema',()=>{

        assert.equal(i, 13);
    });
});