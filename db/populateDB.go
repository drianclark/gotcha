package main

import (
	"database/sql"
	"encoding/csv"
	"io"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// Open the file
	csvfile, err := os.Open("trivia_qs.csv")
	if err != nil {
		log.Fatalln("Couldn't open the csv file", err)
	}

	// Parse the file
	r := csv.NewReader(csvfile)

	db, err := sql.Open("sqlite3", "./gotcha.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		log.Fatal(err)
	}

	stmt, err := tx.Prepare("insert into questions(question, answer) values(?, ?)")
	if err != nil {
		log.Fatal(err)
	}
	defer stmt.Close()

	// Iterate through the records
	for {
		// Read each record from csv
		trivia, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Fatal(err)
		}

		question := trivia[0]
		answer := trivia[1]

		_, err = stmt.Exec(question, answer)
		if err != nil {
			log.Fatal(err)
		}
	}

	tx.Commit()
}
