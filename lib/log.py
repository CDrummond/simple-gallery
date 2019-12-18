#
# Gallery WebApp
# Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
# Licensed under the MIT license.
#

enabled=True

def error(str):
    #global enabled
    #if enabled:
    print("ERROR: %s" % str)

def info(str):
    global enabled
    if enabled:
        print("INFO: %s" % str)
