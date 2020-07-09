const express = require("express");
const pool = require("../modules/pool");
const router = express.Router();
const {
  rejectUnauthenticated,
} = require("../modules/authentication-middleware");

const path = require("path")
const multer = require("multer");
const multerDest = path.join(__dirname, '../uploads');
const upload = multer({ dest: multerDest });
const {
  uploadPetProfile,
  generateSignedUrls,
} = require("../modules/imageHandler");

/**
 * GET route for Pets by client ID
 */

router.get("/", rejectUnauthenticated, (req, res) => {
  const sqlText = `SELECT * from pet where user_id = $1 ORDER BY id;`;
  pool
    .query(sqlText, [req.user.id])
    .then((response) => {
      generateSignedUrls(res, response.rows);
    })
    .catch((error) => {
      res.sendStatus(500);
    });
});

// GET route for careplan - specific pet by ID
router.get("/careplan/:id", rejectUnauthenticated, (req, res) => {
  const sqlText = `select * from pet join medication on medication.pet_id = pet.id where pet.id = $1;`;
  pool
    .query(sqlText, [req.params.id])
    .then((response) => {
      generateSignedUrls(res, response.rows);
    })
    .catch((error) => {
      res.sendStatus(500);
    });
});
/**
 * POST route for PET INFO
 */
router.post("/", rejectUnauthenticated, async (req, res) => {
  try {
    for (let i = 0; i < req.body.pets.length; i++) {
      let queryPet = `INSERT INTO "pet" 
                        ("user_id", "pet_type", "other_pet", "pet_name","weight", "age", 
                        "sex", "breed", "pet_bio", "food_brand", "feeding_per_day",
                        "amount_per_meal", "other_food", "pet_behavior", "care_equipment")
                        VALUES( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)RETURNING id;`;
      let valuesPet = [
        req.user.id,
        req.body.pets[i].pet_type,
        req.body.pets[i].other_pet,
        req.body.pets[i].pet_name,
        req.body.pets[i].weight,
        req.body.pets[i].age,
        req.body.pets[i].sex,
        req.body.pets[i].breed,
        req.body.pets[i].pet_bio,
        req.body.pets[i].food_brand,
        req.body.pets[i].feeding_per_day,
        req.body.pets[i].amount_per_meal,
        req.body.pets[i].other_food,
        req.body.pets[i].pet_behavior,
        req.body.pets[i].care_equipment,
      ];
      let result = await pool.query(queryPet, valuesPet);
      for (let j = 0; j < req.body.pets[i].medications.length; j++) {
        let queryMedication = `INSERT INTO "medication" 
                               ("pet_id", "medication_name", "dosage", "dosage_time")
                               VALUES($1, $2, $3, $4);`;
        let valuesMedication = [
          result.rows[0].id,
          req.body.pets[i].medications[j].medication_name,
          req.body.pets[i].medications[j].dosage,
          req.body.pets[i].medications[j].dosage_time,
        ];
        let medicationResult = await pool.query(
          queryMedication,
          valuesMedication
        );
      }
    }
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  }
});
// update for care plan
router.put("/", rejectUnauthenticated, (req, res) => {
  const {
    id,
    pet_bio,
    care_equipment,
    age,
    weight,
    pet_behavior,
    feeding_per_day,
    food_brand,
    amount_per_meal,
  } = req.body;
  const sqlText = `UPDATE pet SET pet_bio = $2, care_equipment = $3, age = $4, weight = $5, 
    pet_behavior = $6, feeding_per_day = $7, food_brand = $8, amount_per_meal = $9 where pet.id = $1; `;
  pool
    .query(sqlText, [
      id,
      pet_bio,
      care_equipment,
      age,
      weight,
      pet_behavior,
      feeding_per_day,
      food_brand,
      amount_per_meal,
    ])
    .then((response) => {
      res.sendStatus(200);
    })
    .catch((error) => {
      res.sendStatus(500);
    });
});

// update pet profile picture
router.put(
  "/updateProfilePicture/:id",
  rejectUnauthenticated,
  upload.single("file"),
  (req, res) => {
    uploadPetProfile(req, res);
  }
);

module.exports = router;
