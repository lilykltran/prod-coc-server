const decache = require('decache');
const knex = require('../../db/knex');
const request = require('supertest');

describe('Request routing for /api/department-associations', () => {
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
  describe('/api/department-associations', () => {
    it('POST returns 201 when insertion succeeds', done => {
      const payload = {
        email: 'wolsborn@pdx.edu',
        departmentId: 2,
      };

      request(app)
        .post('/api/department-associations')
        .send(payload)
        .expect(
          'Location',
          'http://localhost:8080/api/department-associations/faculty/wolsborn@pdx.edu'
        )
        .expect(201, done);
    });

    it('POST returns 409 when the payload email violates foreign key constraint', done => {
      const payload = {
        email: 'name@pdx.edu',
        departmentId: 22,
      };

      request(app)
        .post('/api/department-associations')
        .send(payload)
        .expect(409, done);
    });

    it('POST returns 409 when the record already exists', done => {
      const payload = {
        email: 'wolsborn@pdx.edu',
        departmentId: 2,
      };

      request(app)
        .post('/api/department-associations')
        .send(payload)
        .expect(201)
        .then(() => {
          request(app)
            .post('/api/department-associations')
            .send(payload)
            .expect(409, done);
        });
    });
  });

  describe('/department/:id', () => {
    it('GET returns 200 when record exists', done => {
      request(app)
        .get('/api/department-associations/department/1')
        .expect(200, done);
    });

    it('GET returns 404 when record does not exist', done => {
      request(app)
        .get('/api/department-associations/department/10000')
        .expect(404, done);
    });
  });

  describe('/faculty/:email', () => {
    it('GET returns 200 when record exists', done => {
      request(app)
        .get('/api/department-associations/faculty/wolsborn@pdx.edu')
        .expect(200, done);
    });

    it('GET returns 404 when record does not exist', done => {
      request(app)
        .get('/api/department-associations/faculty/does-not-exist@mail.com')
        .expect(404, done);
    });
  });

  describe('/', () => {
    it('PUT returns 200 when update succeeds', done => {
      const payload = {
        email: 'ghopper@gmail.com',
        oldDepartmentId: 1,
        newDepartmentId: 2,
      };

      request(app)
        .put('/api/department-associations')
        .send(payload)
        .expect(200, done);
    });

    it('PUT returns 404 when unable to update', done => {
      const payload = {
        email: 'test@test.edu',
        oldDepartmentId: 1,
        newDepartmentId: 2,
      };

      request(app)
        .put('/api/department-associations')
        .send(payload)
        .expect(404, done);
    });
  });
});
