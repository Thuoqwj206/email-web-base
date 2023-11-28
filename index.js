const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");
const mysql = require("mysql2");
const expressLayouts = require("express-ejs-layouts");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.set("layout", "layout");
app.use(expressLayouts);

app.use(express.static(path.join(__dirname, "public")));

const connection = mysql.createConnection({
  host: "localhost",
  user: "wpr",
  password: "fit2023",
  database: "wpr2023",
  port: 3306,
});

connection.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Connected to the database");
  }
});

app.get("/", (req, res) => {
  res.render("signin", { layout: false });
});

app.get("/signup", (req, res) => {
  res.render("signup", { layout: false });
});

app.post("/signin", (req, res) => {
  const { username, password } = req.body;

  connection.query(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [username, password],
    (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).send("Internal Server Error");
      }
      if (results.length > 0) {
        res.cookie("user", username);
        res.redirect("/inbox");
      } else {
        res.render("signin", {
          layout: false,
          error: "Invalid Email or Password",
        });
      }
    }
  );
});

app.post("/signup", (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;

  if (!fullName || !email || !password || password !== confirmPassword) {
    res.render("signup", { layout: false, error: "Invalid registration data" });
  } else {
    connection.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      (err, results) => {
        if (err) {
          console.error("Database error:", err.message);
          return res.status(500).send("Internal Server Error");
        }

        if (results.length > 0) {
          res.render("signup", {
            layout: false,
            error: "Email already in use",
          });
        } else if (password.length < 6) {
          res.render("signup", {
            layout: false,
            error: "Password should be at least 6 characters long.",
          });
        } else {
          connection.query(
            "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)",
            [fullName, email, password],
            (err) => {
              if (err) {
                console.error("Database error:", err.message);
                return res.status(500).send("Internal Server Error");
              }

              return res.render("signup", {
                success: "Welcome! You have successfully signed up.",
              });
            }
          );
        }
      }
    );
  }
});

const requireSignIn = (req, res, next) => {
  if (!req.cookies.user) {
    return res.status(403).send("Access Denied");
  }
  next();
};

const PAGE_SIZE = 5;
const getEmailsByPage = async (userId, page) => {
  try {
    const offset = (page - 1) * PAGE_SIZE;
    const [rows] = await connection.execute(
      "SELECT * FROM emails WHERE receiver_id = ? ORDER BY sent_at DESC LIMIT ?, ?",
      [userId, offset, PAGE_SIZE]
    );
    return rows;
  } catch (error) {
    console.error("Error in getEmailsByPage:", error);
    throw error;
  }
};

app.get("/inbox", requireSignIn, (req, res) => {
  const signedInUser = req.cookies.user;
  const page = parseInt(req.query.page) || 1;
  const emailsPerPage = 5;

  const query = `
    SELECT emails.*, users.full_name AS sender_full_name
    FROM emails 
    JOIN users ON emails.sender_id = users.id
    WHERE receiver_id = (SELECT id FROM users WHERE email = ?)
    ORDER BY sent_at DESC
    LIMIT ?, ?;
  `;

  connection.query(
    query,
    [signedInUser, (page - 1) * emailsPerPage, emailsPerPage],
    (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).send("Internal Server Error");
      }

      connection.query(
        "SELECT COUNT(*) AS total FROM emails WHERE receiver_id = (SELECT id FROM users WHERE email = ?)",
        [signedInUser],
        (err, countResult) => {
          if (err) {
            console.error("Database error:", err.message);
            return res.status(500).send("Internal Server Error");
          }

          const totalEmails = countResult[0].total;
          const totalPages = Math.ceil(totalEmails / emailsPerPage);

          res.render("inbox", {
            emails: results,
            currentPage: page,
            totalPages: totalPages,
          });
        }
      );
    }
  );
});

app.get("/sign-out", (req, res) => {
  res.redirect("/");
});

app.get("/email/:id", requireSignIn, (req, res) => {
  const emailId = req.params.id;

  const query = `
    SELECT emails.*, users.full_name AS sender_full_name
    FROM emails
    INNER JOIN users ON emails.sender_id = users.id
    WHERE emails.id = ?;
  `;

  connection.query(query, [emailId], (err, result) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).send("Internal Server Error");
    }

    const emailDetail = result[0];
    res.render("emailDetail", { email: emailDetail });
  });
});

app.get("/download", (req, res) => {
  const attachmentPath = req.params.attachmentPath;
  const filePath = path.join(__dirname, "attachments", attachmentPath);

  res.download(filePath, attachmentPath, (err) => {
    if (err) {
      console.error("Error downloading attachment:", err.message);
      return res.status(500).send("Internal Server Error");
    }
  });
});

app.get("/compose", requireSignIn, (req, res) => {
  connection.query("SELECT id, full_name FROM users", (err, users) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).send("Internal Server Error");
    }
    res.render("compose", { users });
  });
});

app.post("/compose", requireSignIn, (req, res) => {
  const data = req.body;
  const receiver_id = data.recipientId;
  const subject = data.subject;
  const body = data.body;
  const sender = req.cookies.user;
  const fileName = data.attachment;

  connection.query(
    "INSERT INTO emails (sender_id, receiver_id, subject, body, attachment_path) VALUES ((SELECT id FROM users WHERE email = ?), ?, ?, ?, ?)",
    [sender, receiver_id, subject, body, fileName],
    (err) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).send("Internal Server Error");
      }

      res.redirect("/inbox");
    }
  );
});

app.get("/outbox", requireSignIn, (req, res) => {
  const signedInUser = req.cookies.user;
  const page = parseInt(req.query.page) || 1;
  const emailsPerPage = 5;

  const query = `
  SELECT e.*, u.full_name AS recipient_full_name
  FROM emails e
  JOIN users u ON e.receiver_id = u.id
  WHERE e.sender_id = (SELECT id FROM users WHERE email = ?)
  ORDER BY e.sent_at DESC
  LIMIT ?, ?;
`;

  connection.query(
    query,
    [signedInUser, (page - 1) * emailsPerPage, emailsPerPage],
    (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).send("Internal Server Error");
      }

      const countQuery = `
      SELECT COUNT(*) AS total
      FROM emails
      WHERE sender_id = (SELECT id FROM users WHERE email = ?)
    `;

      connection.query(countQuery, [signedInUser], (err, countResult) => {
        if (err) {
          console.error("Database error:", err.message);
          return res.status(500).send("Internal Server Error");
        }

        const totalEmails = countResult[0].total;
        const totalPages = Math.ceil(totalEmails / emailsPerPage);

        res.render("outbox", {
          emails: results,
          currentPage: page,
          totalPages: totalPages,
        });
      });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

process.on("SIGINT", () => {
  connection.end();
  process.exit();
});
