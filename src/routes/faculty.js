const express = require('express');
const router = express.Router();
const {
  addFaculty,
  updateFaculty,
  FOREIGN_KEY_VIOLATION,
  UNIQUENESS_VIOLATION,
} = require('../database');

router.post('/', async (req, res) => {
  if (
    !req.body ||
    !req.body.fullName ||
    !req.body.email ||
    !req.body.jobTitle ||
    !req.body.phoneNum ||
    !req.body.senateDivision
  ) {
    return res.status(400).send({ message: '400 Bad Request' });
  }

  const { fullName, email, jobTitle, phoneNum, senateDivision } = req.body;

  return await addFaculty(fullName, email, jobTitle, phoneNum, senateDivision)
    .then(() => {
      console.info('Added faculty member to database');
      return res.status(201).send();
    })
    .catch(err => {
      if ([FOREIGN_KEY_VIOLATION, UNIQUENESS_VIOLATION].includes(err.code)) {
        console.error(
          `Attempted to add an existing faculty with invalid keys: ${err}`
        );
        return res.status(409).send();
      }

      console.error(`Error adding faculty member to database: ${err}`);
      return res
        .status(500)
        .send({ error: 'Unable to complete database transaction' });
    });
});

router.put('/', async (req, res) => {
  if (
    !req.body ||
    !req.body.fullName ||
    !req.body.email ||
    !req.body.jobTitle ||
    !req.body.phoneNum ||
    !req.body.senateDivision
  ) {
    return res.status(400).send({ message: '400 Bad Request' });
  }

  const { fullName, email, jobTitle, phoneNum, senateDivision } = req.body;

  return await updateFaculty(fullName, email, jobTitle, phoneNum, senateDivision)
    .then(result => {
      if (!result.rowCount) {
        console.info(
          `Unable to update faculty record, email ${email} does not exist`
        );
        return res.status(404).send();
      }

      console.info(`Updated faculty member with email ${email}`);
      return res.status(200).send();
    })
    .catch(err => {
      console.error(`Error updating faculty member in database: ${err}`);
      return res
        .status(500)
        .send({ error: 'Unable to complete database transaction' });
    });
});

module.exports = router;