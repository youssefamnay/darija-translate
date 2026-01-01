const db = require('./database');

console.log('Fetching users...');

const sql = 'SELECT * FROM users';
db.db.all(sql, [], (err, rows) => {
    if (err) {
        throw err;
    }
    console.log('Users found:', rows.length);
    rows.forEach((row) => {
        console.log(`${row.id}: ${row.email} (Verified: ${row.verified})`);

        if (!row.verified) {
            console.log(`Verifying user ${row.email}...`);
            db.verifyUser(row.id, (err) => {
                if (err) console.error(err);
                else console.log(`User ${row.email} verified successfully!`);
            });
        }
    });

    // Allow time for async updates before exiting (dirty but effective script)
    setTimeout(() => {
        console.log('Done.');
        process.exit(0);
    }, 1000);
});
