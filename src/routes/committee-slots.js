const express = require('express');
const router = express.Router();
const { SERVER_URL } = require('../config');
const {
  addCommitteeSlots,
  getCommitteeSlotsBySenate,
  getCommitteeSlotsByCommittee,
  updateCommitteeSlots,
  deleteSlotRequirement,
  FOREIGN_KEY_VIOLATION,
  UNIQUENESS_VIOLATION,
  messageResponses,
} = require('../database');

router.get('/senate-division/:shortname', async (req, res) => {
  return await getCommitteeSlotsBySenate(req.params.shortname)
    .then(data => {
      if (data.length === 0) {
        console.info(
          `No slot requirements found for senate division ${req.params.shortname}`
        );
        return res.status(404).send({ message: messageResponses[404] });
      }

      console.info(
        `Successfully retrieved slot requirements for ${req.params.shortname}`
      );
      return res.status(200).send(data);
    })
    .catch(err => {
      console.error(`Error retrieving slot requirements: ${err}`);
      return res
        .status(500)
        .send({ message: messageResponses[500], error: err.message });
    });
});

router.get('/committee/:id', async (req, res) => {
  return await getCommitteeSlotsByCommittee(req.params.id)
    .then(data => {
      if (data.length === 0) {
        console.info(`No slot requirements found for committee ${req.params.id}`);
        return res.status(404).send({ message: messageResponses[404] });
      }

      console.info(
        `Successfully retrieved slot requirements for committee ${req.params.id}`
      );
      res.status(200).send(data);
    })
    .catch(err => {
      console.error(`Error retrieving slot requirements: ${err}`);
      return res
        .status(500)
        .send({ message: messageResponses[500], error: err.message });
    });
});

router.put('/:id/:name', async (req, res) => {
  if (!req.body || !req.body.slotRequirements || req.body.slotRequirements < 0) {
    return res.status(400).send({ message: messageResponses[400] });
  }

  const { id, name } = req.params;
  const { slotRequirements } = req.body;

  return await updateCommitteeSlots(id, name, slotRequirements)
    .then(result => {
      if (result[0].rowCount === 0) {
        console.info(
          `Unable to update committee slots record, committee id ${id} or senate division ${name} do not exist`
        );
        console.log(result);
        return res.status(404).send({ message: messageResponses[404] });
      }

      console.info(
        `Updated committee slots with committee id ${id} and senate division ${name}`
      );
      return res.status(200).send({ message: messageResponses[200] });
    })
    .catch(err => {
      console.error(`Error updating committee slots record in database: ${err}`);
      return res
        .status(500)
        .send({ message: messageResponses[500], error: err.message });
    });
});

router.post('/', async (req, res) => {
  if (
    !req.body ||
    !req.body.committeeId ||
    !req.body.senateDivision ||
    !req.body.slotRequirements
  ) {
    return res.status(400).send({ message: messageResponses[400] });
  }

  const { committeeId, senateDivision, slotRequirements } = req.body;

  return addCommitteeSlots(committeeId, senateDivision, slotRequirements)
    .then(result => {
      console.info('Successfully added committee slots to database');

      let e = {};

      if (Array.isArray(result) && result.length) {
        e = { return: result[0].committeeId };
      } else {
        e = { return: result.committeeId };
      }

      return res
        .set('Location', `${SERVER_URL}/api/committee-slots/committee/${e.return}`)
        .status(201)
        .send({ message: messageResponses[201] });
    })
    .catch(err => {
      let code;
      let message;
      let detail;

      if (!err.stat) {
        code = err.code;
        message = err.message;
        detail = err.detail;
      } else {
        code = err.first.code;
        message = err.first.message;
        detail = err.first.detail;
      }

      if ([FOREIGN_KEY_VIOLATION, UNIQUENESS_VIOLATION].includes(code)) {
        const hint =
          'You are trying to add a committee assignment that already exists.';
        console.error(
          `Attempted to add existing committee slots with invalid keys: ${message}`
        );
        return res
          .status(409)
          .send({ message: message, error: detail, hint: hint });
      }
      console.error(`Error adding committee slots: ${err}`);
      return res
        .status(500)
        .send({ message: messageResponses[500], error: err.message });
    });
});

router.delete('/:id/:name', async (req, res) => {
  return await deleteSlotRequirement(req.params.id, req.params.name)
    .then(result => {
      if (result.rowCount !== 1) {
        console.info(
          `No slot requirement found for committee id ${req.params.id} and senate division short name ${req.params.name}`
        );
        return res.status(404).send({ message: messageResponses[404] });
      }
      console.info('Successfully retrieved slot requirement from database');
      return res.status(200).send({ message: messageResponses[200] });
    })
    .catch(err => {
      console.error(`Error retrieving slot requirement: ${err}`);
      return res
        .status(500)
        .send({ message: 'Internal Server Error', error: err.message });
    });
});

module.exports = router;
