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


    it('usages', function(){
        wordsOperators.splitBlocks(testLangs[0].lang, 'Hello[192] world[90]');
        wordsOperators.splitBlocks(testLangs[1].lang, 'Ahoj[192] svete');
        wordsOperators.splitBlocks(testLangs[2].lang, 'Hello[192] world[90]');
        var usages = wordsOperators.calcUsagesForWordsForAllLangs();
        expect(typeof usages).toBe('object');
        expect(usages).toEqual({'192':3,'90':2});
    });

    it('diff usages', function(){

        var usages = wordsOperators.diffWordUsages({'192':3,'90':2},{'192':1,'198': 1});
        expect(typeof usages).toBe('object');
        expect(usages).toEqual({'192':2,'90':2, '198': -1});
    });

    it('diff usages with 0', function(){

        var usages = wordsOperators.diffWordUsages({'192':3,'90':2},{'192':3,'198': 2});
        expect(typeof usages).toBe('object');
        expect(usages).toEqual({'192':0,'90':2, '198': -2});
    });

    it('usages into payload for updateUsages', function(){

        var payload = wordsOperators.generatePayloadForUpdateUsagesRequest({'192':2,'90':2, '198': -1,'188':1,'12':-1,'19': 0});
        expect(typeof payload).toBe('object');
        expect(payload).toEqual({'2':[90,192],'1':[188], '-1': [12,198]});
    });

    it('usages into payload for updateUsages - null', function(){

        var payload = wordsOperators.generatePayloadForUpdateUsagesRequest({'192':0,'90':0});
        expect(payload).toBeNull();
    });

    it('remove bracked from sentences', function(){
        var removedBracked = wordsOperators.removeWordLinks('Hello[192] world[90]');
        expect(removedBracked).not.toBeNull();
        expect(removedBracked).not.toContain('[')
        expect(removedBracked).not.toContain(']')
        expect(removedBracked).not.toContain('192')
        expect(removedBracked).not.toContain('90')
    });
});

