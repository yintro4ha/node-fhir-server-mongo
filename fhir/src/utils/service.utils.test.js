const { CLIENT, CLIENT_DB } = require('../constants');
const asyncHandler = require('../lib/async-handler');
const logger = require('../testutils/logger.mock');
const organizationService = require('../services/organization/organization.service');
const patientService = require('../services/patient/patient.service');
const { mongoConfig } = require('../config');
const mongoClient = require('../lib/mongo');
let globals = require('../globals');
const { numberQueryBuilder, quantityQueryBuilder, compositeQueryBuilder } = require('./service.utils');

describe('Service Utils Tests', () => {

    beforeAll(async () => {

        let [err, client] = await asyncHandler(
            mongoClient(mongoConfig.connection, mongoConfig.options)
        );

        // We should fail these tests if we can't connect,
        // they won't work without the connection
        if (err) {
            throw err;
        }

        globals.set(CLIENT, client);
        globals.set(CLIENT_DB, client.db(mongoConfig.db_name));

    });

    afterAll(() => {
        let client = globals.get(CLIENT);
        client.close();
    });

    describe('Method: stringQueryBuilder', () => {

        test('should pass back the correct company based on portions of the name or alias', async () => {
            // Default name case
            let args = {name: 'HeaLth'};
            let [err, docs] = await asyncHandler(
                organizationService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(1);
            expect(docs[0].name).toEqual('Health Level Seven International');

            // // contains name case
            // args = {name: 'name:contains=EvEn'};
            // [err, docs] = await asyncHandler(
            //     organizationService.search(args, logger)
            // );
            // expect(err).toBeUndefined();
            // expect(docs.length).toEqual(1);
            // expect(docs[0].name).toEqual('Health Level Seven International');
            //
            // // exact name case
            // args = {name: 'name:exact=Health Level Seven International'};
            // [err, docs] = await asyncHandler(
            //     organizationService.search(args, logger)
            // );
            // expect(err).toBeUndefined();
            // expect(docs.length).toEqual(1);
            // expect(docs[0].name).toEqual('Health Level Seven International');

            // Default alias case
            args = {name: 'A gO'};
            [err, docs] = await asyncHandler(
                organizationService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(1);
            expect(docs[0].alias[1]).toEqual('A good test');

            // // contains alias case
            // args = {name: 'alias:contains=s'};
            // [err, docs] = await asyncHandler(
            //     organizationService.search(args, logger)
            // );
            // expect(err).toBeUndefined();
            // expect(docs.length).toEqual(1);
            // expect(docs[0].alias[0]).toEqual('HLSI');
            // expect(docs[0].alias[1]).toEqual('A good test');
            //
            // // exact alias case
            // args = {name: 'alias:exact=HLSI'};
            // [err, docs] = await asyncHandler(
            //     organizationService.search(args, logger)
            // );
            // expect(err).toBeUndefined();
            // expect(docs.length).toEqual(1);
            // expect(docs[0].alias[0]).toEqual('HLSI');

        });

    });

    describe('Method: tokenQueryBuilder', () => {

        test('should pass back the correct company based on portions of identifier', async () => {
            // system|code
            let args = {identifier: 'http://hl7.org.fhir/sid/us-npi|1144221847'};
            let [err, docs] = await asyncHandler(
                organizationService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(2);
            expect(docs[0].identifier[0].system).toEqual('http://hl7.org.fhir/sid/us-npi');
            expect(docs[0].identifier[0].value).toEqual('1144221847');

            // system|
            args = {identifier: 'http://hl7.org.fhir/sid/us-npi|'};
            [err, docs] = await asyncHandler(
                organizationService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(2);
            expect(docs[0].identifier[0].system).toEqual('http://hl7.org.fhir/sid/us-npi');

            // |code
            args = {identifier: '|1144221847'};
            [err, docs] = await asyncHandler(
                organizationService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(2);
            expect(docs[0].identifier[0].value).toEqual('1144221847');

            // code
            args = {identifier: '1144221847'};
            [err, docs] = await asyncHandler(
                organizationService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(2);
            expect(docs[0].identifier[0].value).toEqual('1144221847');

            // required system
            args = {email: 'p.heuvel@gmail.com'};
            [err, docs] = await asyncHandler(
                patientService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(1);
            expect(docs[0].telecom[4].value).toEqual('p.heuvel@gmail.com');

        });

        test('should handle codeable concepts', async () => {
            // system|code
            let args = {type: 'http://hl7.org/fhir/organization-type|prov'};
            let [err, docs] = await asyncHandler(
                organizationService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(2);
            expect(docs[0].type[0].coding[0].system).toEqual('http://hl7.org/fhir/organization-type');
            expect(docs[0].type[0].coding[0].code).toEqual('prov');

        });

    });

    describe('Method: referenceQueryBuilder', () => {

        test('should pass back the correct careplan based on the performer', async () => {
            // url
            let args = {partof: 'https://foo.com/fhir/Organization/1'};
            let [err, docs] = await asyncHandler(
                organizationService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(1);
            expect(docs[0].partOf.reference).toEqual('Organization/1');

            // type/id
            args = {partof: 'Organization/1'};
            [err, docs] = await asyncHandler(
                organizationService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(1);
            expect(docs[0].partOf.reference).toEqual('Organization/1');

            // id
            args = {partof: '1'};
            [err, docs] = await asyncHandler(
                organizationService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(1);
            expect(docs[0].partOf.reference).toEqual('Organization/1');

        });

    });

    describe('Method: addressQueryBuilder', () => {

        test('should pass back an organization based on parts of the address', async () => {
            // Handle a full address
            let args = {address: '3300 Washtenaw Avenue, Suite 227, Ann Arbor, MI  48104 UsA'};
            let [err, docs] = await asyncHandler(
                organizationService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(1);

            // Handle Line and Country with weird case
            args = {address: '3300 WAshtenaw Avenue, Suite 227          ,,,,,,,,,     ,MI'};
            [err, docs] = await asyncHandler(
                organizationService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(1);

            // Should not handle spelling errors
            args = {address: '3300 Washtenaw Avenue, Sute 227, Ann Arbor, MI  48104 UsA'};
            [err, docs] = await asyncHandler(
                organizationService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(0);

            // Find all orgs in the US (should match USA too)
            args = {address: 'Us'};
            [err, docs] = await asyncHandler(
                organizationService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(2);

        });

    });

    describe('Method: nameQueryBuilder', () => {

        test('should pass back a name based on parts of it', async () => {
            // Handle a full address
            let args = {name: 'Peter James Chalmers'};
            let [err, docs] = await asyncHandler(
                patientService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(1);

            // Handle multiple last names regardless of order
            args = {name: 'Windsor          ,,,,,,,,,     . Chalmers'};
            [err, docs] = await asyncHandler(
                patientService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(1);

            // Should not handle spelling errors
            args = {name: 'Peter James Calmers'};
            [err, docs] = await asyncHandler(
                patientService.search(args, logger)
            );
            expect(err).toBeUndefined();
            expect(docs.length).toEqual(0);

        });

    });

    describe('Method: numberQueryBuilder', () => {

        test('should pass back a query based on a prefix', async () => {
            let query = numberQueryBuilder('lt12');
            expect(query).toEqual({$lt: 12});

            query = numberQueryBuilder('le12');
            expect(query).toEqual({$lte: 12});

            query = numberQueryBuilder('gt12');
            expect(query).toEqual({$gt: 12});

            query = numberQueryBuilder('ge12');
            expect(query).toEqual({$gte: 12});

            query = numberQueryBuilder('ne12');
            expect(query).toEqual({$ne: 12});

        });

        test('should pass back an approximation query', async () => {
            let query = numberQueryBuilder('100');
            expect(query).toEqual({$gte: 99.5, $lt: 100.5});

            query = numberQueryBuilder('100.00');
            expect(query).toEqual({$gte: 99.995, $lt: 100.005});

        });

    });

    describe('Method: quantityQueryBuilder', () => {

        test('should pass back a query based on a prefix', async () => {
            let query = quantityQueryBuilder('lt12||mm', 'example');
            expect(query).toEqual({'example.code': 'mm', 'example.value': {$lt: 12}});

            query = quantityQueryBuilder('le12||mm', 'example');
            expect(query).toEqual({'example.code': 'mm', 'example.value': {$lte: 12}});

            query = quantityQueryBuilder('gt12||mm', 'example');
            expect(query).toEqual({'example.code': 'mm', 'example.value': {$gt: 12}});

            query = quantityQueryBuilder('ge12||mm', 'example');
            expect(query).toEqual({'example.code': 'mm', 'example.value': {$gte: 12}});

            query = quantityQueryBuilder('ne12||mm', 'example');
            expect(query).toEqual({'example.code': 'mm', 'example.value': {$ne: 12}});

        });

        test('should pass the default query', async () => {
            let query = quantityQueryBuilder('12||mm', 'example');
            expect(query).toEqual({'example.code': 'mm', 'example.value': 12});

        });

    });

    describe('Method: compositeQueryBuilder', () => {

        test('should pass the each query type', async () => {
            // Token and string
            let query = compositeQueryBuilder('http://foo.org|3$bar5', 'code.coding|token', 'valueString|string');
            expect(query).toEqual({$and: [{'code.coding.system': 'http://foo.org', 'code.coding.code': '3'},
                    {'valueString': {$regex: new RegExp('^' + 'bar5', 'i')}}]});

            // Reference and quantity
            query = compositeQueryBuilder('Encounter/example$60||mm', 'foo.reference|reference', 'bar|quantity');
            expect(query).toEqual({$and: [{'foo.reference': 'Encounter/example'}, {'bar.code': 'mm', 'bar.value': 60}]});

            // Number and code
            query = compositeQueryBuilder('lt12$example', 'foo|number', 'bar|code');
            expect(query).toEqual({$and: [{'foo': {$lt: 12}}, {'bar': 'example'}]});

        });

        test('should pass an or', async () => {
            let query = compositeQueryBuilder('http://foo.org|3,bar5', 'code.coding|token', 'valueString|string');
            expect(query).toEqual({$or: [{'code.coding.system': 'http://foo.org', 'code.coding.code': '3'},
                    {'valueString': {$regex: new RegExp('^' + 'bar5', 'i')}}]});

        });

    });

});
