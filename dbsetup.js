const mysql = require("mysql2");

const dbConfig = {
  host: "localhost",
  user: "wpr",
  password: "fit2023",
  database: "wpr2023",
  port: 3306,
};

const connection = mysql.createConnection(dbConfig);

const createTables = `
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);
`;

const createEmailsTable = `
CREATE TABLE IF NOT EXISTS emails (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT,
    receiver_id INT,
    subject VARCHAR(255),
    body TEXT,
    attachment_path VARCHAR(255),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);
`;

const sampleData = `
INSERT INTO users (full_name, email, password) VALUES
('Alexander Arnol', 'a@a.com', '123456'),
('Alice Smith', 'alice.smith@example.com', 'securepass'),
('Bob Johnson', 'bob.johnson@example.com', 'pass123word'),
('Emma White', 'emma.white@example.com', 'strongpassword'),
('David Brown', 'david.brown@example.com', 'p@ssw0rd');
`;

const insertEmailsData = `
INSERT INTO emails (sender_id, receiver_id, subject, body, attachment_path, sent_at) VALUES
(1, 2, 'Meeting Tomorrow', 'Hi Alice, Let''s meet tomorrow at 10 AM. Regards, John.', NULL, '2023-01-15 08:30:00'),
(3, 4, 'Project Update', 'Hello Emma, Here is the latest update on the project. Please review and provide feedback. Thanks, Bob.', NULL, '2023-01-16 12:45:00'),
(5, 1, 'Important Announcement', 'Dear John, Please be informed of the upcoming company announcement. Regards, David.', NULL, '2023-01-17 15:20:00'),
(2, 3, 'Invitation to Party', 'Hi Bob, You are invited to a party this Saturday. Bring your friends! Cheers, Alice.', NULL, '2023-01-18 18:00:00'),
(4, 5, 'New Account Details', 'Hello David, Your new account details are attached. Best, Emma.', '/attachments/account_details.pdf', '2023-01-19 09:10:00'),
(1, 2, 'Reminder: Deadline Approaching', 'Hi Alice, Just a reminder that the deadline is approaching. Finish your tasks on time. Regards, John.', NULL, '2023-01-20 14:30:00'),
(3, 4, 'Meeting Rescheduled', 'Hello Emma, The meeting scheduled for tomorrow has been rescheduled to next week. Regards, Bob.', NULL, '2023-01-21 17:45:00'),
(5, 1, 'Password Update', 'Dear John, Your password has been updated successfully. If you did not make this change, please contact support. Best, David.', NULL, '2023-01-22 11:00:00'),
(2, 1, 'Important Notice', 'Hi Bob, Please read the important notice attached to this email. Regards, Alice.', '/attachments/important_notice.docx', '2023-01-23 13:15:00'),
(4, 5, 'Security Alert', 'Hello David, We detected a login attempt from an unfamiliar device. Please verify your account. Thanks, Emma.', NULL, '2023-01-24 16:30:00'),
(1, 2, 'Coffee Meeting', 'Hi Alice, Let''s grab coffee next week. John.', NULL, '2023-01-25 09:45:00'),
(3, 4, 'Vacation Plans', 'Hello Emma, I''m planning a vacation. Do you have any recommendations? Bob.', NULL, '2023-01-26 14:20:00'),
(5, 1, 'Birthday Wishes', 'Dear John, Wishing you a fantastic birthday! David.', NULL, '2023-01-27 18:00:00'),
(2, 3, 'New Project Kickoff', 'Hi Bob, The new project kickoff is scheduled for next month. Are you ready? Alice.', NULL, '2023-01-28 11:30:00'),
(4, 1, 'Job Opportunity', 'Hello David, I found an interesting job opportunity for you. Let''s discuss. Emma.', NULL, '2023-01-29 16:15:00'),
(1, 2, 'Dinner Plans', 'Hi Alice, How about dinner this weekend? John.', NULL, '2023-01-30 19:00:00'),
(3, 4, 'Product Launch', 'Hello Emma, The product launch event is coming up. Make sure to prepare. Bob.', NULL, '2023-01-31 12:00:00'),
(5, 1, 'Family Gathering', 'Dear John, We''re having a family gathering. Can you make it? David.', NULL, '2023-02-01 15:30:00'),
(2, 1, 'Conference Registration', 'Hi Bob, Have you registered for the conference? Alice.', NULL, '2023-02-02 09:45:00'),
(1, 5, 'Happy New Year!', 'Hello David, Wishing you a happy and successful New Year! Emma.', NULL, '2023-02-03 14:00:00');
`;

connection.query(createTables, (err) => {
  if (err) throw err;

  connection.query(createEmailsTable, (err) => {
    if (err) throw err;

    connection.query(sampleData, (err) => {
      if (err) throw err;

      connection.query(insertEmailsData, (err) => {
        if (err) throw err;
        connection.end();
      });
    });
  });
});
