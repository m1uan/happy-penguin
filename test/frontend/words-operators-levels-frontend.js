describe('BlockOperators', function() {
    var testLangs = [{lang:'en'},{lang:'cs'},{lang:'es'}]
    var wordsOperators;

    beforeEach(function(){
        wordsOperators = new BlockOperators(testLangs);
    })

    it('langs contain', function(){
        expect(wordsOperators.langs).toBeDefined();
        expect(wordsOperators.langs).toEqual(testLangs);
    })

    it('split words', function(){
        wordsOperators.words[testLangs[0].lang] = [];
        wordsOperators.splitWords(testLangs[0].lang, 'Hello[192] world[90]');
        expect(typeof wordsOperators.words).toBe('object');
        var words = wordsOperators.words[testLangs[0].lang];
        expect(words.length).toEqual(2);

        expect(words[0].link).toEqual(192);
        expect(words[0].simple).toEqual('Hello');
        expect(words[0].type).toEqual(0);
        //browser().navigateTo('/pages');
    });

    it('split block', function(){
        wordsOperators.splitBlocks(testLangs[0].lang, 'Hello[192] world[90].\n\nHello[192] world[90].');
        expect(typeof wordsOperators.words).toBe('object');
        var words = wordsOperators.words[testLangs[0].lang];
        expect(words.length).toEqual(8);

        expect(words[2].type).toEqual(2);
        expect(words[3].type).toEqual(1);

        //browser().navigateTo('/pages');
    });
});

