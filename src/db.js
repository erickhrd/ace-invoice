const sql = require("mssql");

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  server: process.env.DB_HOST,
  options: {
    encrypt: true, 
    trustServerCertificate: false
  }
};

async function getPool() {
try{
    const pool = await sql.connect(config);
    console.log("Successfully connected to SQL Server")
    return pool;
    } catch(err){
        console.error("Failed connection to SQL Server", err.message);
        throw err;
   }
}

module.exports = { sql, getPool };
