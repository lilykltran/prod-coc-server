const decache = require('decache');
const knex = require('../../db/knex');
const request = require('supertest');

describe('Request routing for /api/survey-data', () => {
  let app;

  beforeEach(async () => {
    decache('../../src');
    app = require('../../src');

    await knex.migrate.rollback();
    await knex.migrate.latest();
    await knex.seed.run();
  });

  afterEach(done => {
    knex.migrate.rollback().then(() => {
      app.close(done);
    });
  });

  it('GET returns 200 when record exists', done => {
    request(app)
      .get('/api/survey-data/2019/wolsborn@pdx.edu')
      .expect(200, done);
  });

  it('GET returns 404 when date does not exist', done => {
    request(app)
      .get('/api/survey-data/3010/wolsborn@pdx.edu')
      .expect(404, done);
  });

  it('GET returns 404 when email does not exist', done => {
    request(app)
      .get('/api/survey-data/2019/does-not-exist')
      .expect(404, done);
  });

  it('POST returns 201 when insertion succeeds', done => {
    const payload = {
      surveyDate: '2018-01-01',
      email: 'wolsborn@pdx.edu',
      isInterested: true,
      expertise: 'TEST',
    };

    request(app)
      .post('/api/survey-data')
      .send(payload)
      .expect(
        'Location',
        'http://localhost:8080/api/survey-data/2018/wolsborn@pdx.edu'
      )
      .expect(201, done);
  });

  it('POST returns 409 when the payload email violates foreign key constraint', done => {
    const payload = {
      surveyDate: '2019-01-01',
      email: 'test-email',
      isInterested: true,
      expertise: 'TEST',
    };

    request(app)
      .post('/api/survey-data')
      .send(payload)
      .expect(409, done);
  });

  it('POST returns 409 when the record already exists', done => {
    const payload = {
      surveyDate: '2050-01-01',
      email: 'wolsborn@pdx.edu',
      isInterested: true,
      expertise: 'TEST',
    };

    request(app)
      .post('/api/survey-data')
      .send(payload)
      .expect(201)
      .then(() => {
        request(app)
          .post('/api/survey-data')
          .send(payload)
          .expect(409, done);
      });
  });

  it('PUT returns 200 when update succeeds', done => {
    const payload = {
      surveyDate: '2019-01-01',
      email: 'wolsborn@pdx.edu',
      isInterested: true,
      expertise: 'TEST',
    };

    request(app)
      .put('/api/survey-data')
      .send(payload)
      .expect(200, done);
  });

  it('PUT returns 404 when target record to update does not exist', done => {
    const payload = {
      surveyDate: '2010-01-01',
      email: 'test@pdx.edu',
      isInterested: true,
      expertise: 'TEST',
    };

    request(app)
      .put('/api/survey-data')
      .send(payload)
      .expect(404, done);
  });
});
