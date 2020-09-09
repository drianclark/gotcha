package main

import (
	"database/sql"
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3" // underscore to register sqlite
)

func main() {
	// Open the file
	csvfile, err := os.Open("trivia_qs.csv")
	if err != nil {
		log.Fatal("Couldn't open the csv file", err)
	}

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

	stmt, err := tx.Prepare("INSERT into questions(question, answer) values(?, ?)")
	if err != nil {
		log.Fatal(err)
	}
	defer stmt.Close()

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
			fmt.Println(question)
			log.Fatal(err)
		}
	}

	tx.Commit()

	return

	// sqlStmt := `
	// INSERT into questions (category, question, answer) VALUES ("test category", "test question", "test answer");
	// `

	// _, err = db.Exec(sqlStmt)
	// if err != nil {
	// 	log.Printf("%q: %s\n", err, sqlStmt)
	// 	return
	// }
}
