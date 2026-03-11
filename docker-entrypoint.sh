#!/bin/sh
set -e

node prisma/init.mjs

exec "$@"
