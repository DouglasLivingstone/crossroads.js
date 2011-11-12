/*jshint onevar:false */

//for node
var crossroads = crossroads || require('crossroads');
//end node


describe('route.linkTo()', function(){

    afterEach(function(){
        crossroads.removeAllRoutes();
    });


    it('should return the pattern if there are no parameters', function(){
        var r1 = crossroads.addRoute('/lorem-ipsum');
        expect( r1.linkTo() ).toBe( '/lorem-ipsum' );
    });

    it('should substitute required parameters', function(){
        var r1 = crossroads.addRoute('/lorem-ipsum/{foo}');
        var r2 = crossroads.addRoute('/lorem-ipsum/{foo}/');
        var r3 = crossroads.addRoute('/lorem-ipsum/{foo}/{bar}');
        var r4 = crossroads.addRoute('/lorem-ipsum/{foo}/{bar}/');

        expect( r1.linkTo({ foo: 'dolor' }) ).toBe( '/lorem-ipsum/dolor' );
        expect( r2.linkTo({ foo: 'dolor' }) ).toBe( '/lorem-ipsum/dolor/' );
        expect( r3.linkTo({ foo: 'dolor', bar: 'sit' }) ).toBe( '/lorem-ipsum/dolor/sit' );
        expect( r4.linkTo({ foo: 'dolor', bar: 'sit' }) ).toBe( '/lorem-ipsum/dolor/sit/' );
    });

    it('should substitute optional parameters', function(){
        var r1 = crossroads.addRoute('/lorem-ipsum/:foo:');
        var r2 = crossroads.addRoute('/lorem-ipsum/:foo:/:bar:');
        var r3 = crossroads.addRoute('/lorem-ipsum/{foo}/:bar:');

        expect( r1.linkTo() ).toBe( '/lorem-ipsum' );
        expect( r1.linkTo({ foo: 'dolor' }) ).toBe( '/lorem-ipsum/dolor' );

        expect( r2.linkTo() ).toBe( '/lorem-ipsum' );
        expect( r2.linkTo({ foo: 'dolor' }) ).toBe( '/lorem-ipsum/dolor' );
        expect( r2.linkTo({ foo: 'dolor', bar: 'sit' }) ).toBe( '/lorem-ipsum/dolor/sit' );

        expect( r3.linkTo({ foo: 'dolor' }) ).toBe( '/lorem-ipsum/dolor' );
        expect( r3.linkTo({ foo: 'dolor', bar: 'sit' }) ).toBe( '/lorem-ipsum/dolor/sit' );
    });

    it('should insert implied slashes', function(){
        var r1 = crossroads.addRoute('/lorem-ipsum:foo:');
        var r2 = crossroads.addRoute('/lorem-ipsum:foo::bar:');
        var r3 = crossroads.addRoute('/lorem-ipsum/{foo}:bar:');

        expect( r1.linkTo() ).toBe( '/lorem-ipsum' );
        expect( r1.linkTo({ foo: 'dolor' }) ).toBe( '/lorem-ipsum/dolor' );

        expect( r2.linkTo() ).toBe( '/lorem-ipsum' );
        expect( r2.linkTo({ foo: 'dolor' }) ).toBe( '/lorem-ipsum/dolor' );
        expect( r2.linkTo({ foo: 'dolor', bar: 'sit' }) ).toBe( '/lorem-ipsum/dolor/sit' );

        expect( r3.linkTo({ foo: 'dolor' }) ).toBe( '/lorem-ipsum/dolor' );
        expect( r3.linkTo({ foo: 'dolor', bar: 'sit' }) ).toBe( '/lorem-ipsum/dolor/sit' );
    });

    it('should work even with optional params on the middle of pattern', function(){
        var a = crossroads.addRoute('/{foo}/:bar:/{ipsum}');
        expect( a.linkTo({ foo: '123', bar: '45', ipsum: 'asd' }) ).toBe( '/123/45/asd' );
        expect( a.linkTo({ foo: '123', ipsum: 'asd' }) ).toBe( '/123/asd' );

        var b = crossroads.addRoute('/{foo}:bar:{ipsum}');
        expect( b.linkTo({ foo: '123', bar: '45', ipsum: 'asd' }) ).toBe( '/123/45/asd' );

        var c = crossroads.addRoute('/{foo}:bar:/ipsum');
        expect( c.linkTo({ foo: '123', bar: '45' }) ).toBe( '/123/45/ipsum' );
        expect( c.linkTo({ foo: '123' }) ).toBe( '/123/ipsum' );

        var d = crossroads.addRoute('/{foo}:bar:ipsum'); //weird use!
        expect( d.linkTo({ foo: '123' }) ).toBe( '/123/ipsum' );
        expect( d.linkTo({ foo: '123', bar: '45' }) ).toBe( '/123/45/ipsum' );

        var e = crossroads.addRoute('/{foo}ipsum'); //weird use!
        expect( e.linkTo({ foo: '123' }) ).toBe( '/123/ipsum' );
    });

    it('shoud treat missing required parameters as an error', function(){
        var r1 = crossroads.addRoute('/lorem-ipsum/{foo}');
        var r2 = crossroads.addRoute('/lorem-ipsum/{foo}/{bar}');

        expect( function() { r1.linkTo() } ).toThrow('Missing parameter "foo"');
        expect( function() { r2.linkTo({ bar: 'dolor' }) } ).toThrow('Missing parameter "foo"');
    });

});
