#!/bin/bash

echo "Waiting for schema registry api..."
while true; do
  curl -f http://localhost:8081/ > /dev/null 2> /dev/null
  if [ $? = 0 ]; then
    echo "Test api started"
    break
  fi

  sleep 2
done
