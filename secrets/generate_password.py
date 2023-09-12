#!/usr/bin/env python

import argparse
import secrets
import string

ALPHANUM = string.ascii_letters + string.digits


def generate_password(length: int):
    return "".join(secrets.choice(ALPHANUM) for i in range(length))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simple password generator")
    parser.add_argument(
        "-l", "--length", nargs="?", type=int, help="Length of generated password"
    )
    args = parser.parse_args()
    length = args.length or 32
    password = generate_password(length)
    print(password)
