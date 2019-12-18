#
# Gallery WebApp
# Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
# Licensed under the MIT license.
#

import json
import os
import subprocess
import time
from . import log

dateEndings={1:'st', 2:'nd', 3:'rd', 21:'st', 22:'nd', 23:'rd', 31:'st' }

def which(file):
    for path in os.environ["PATH"].split(os.pathsep):
        if os.path.exists(os.path.join(path, file)):
            return os.path.join(path, file)
    return None

def removeExtension(fileName):
    return fileName.rsplit('.', 1)[0]

def fileNameNoExt(fileName):
    return os.path.basename(fileName).rsplit('.', 1)[0]

def dateStr(t, shortName=False):
    return timeStr(t, '%A {D} %B %Y', shortName)

def timeStr(t, fmt='%A {D} %B %Y, {H}:%M %p', shortName=False):
    hour=t.tm_hour
    if hour>12:
        hour-=12
    if shortName:
        fmt=fmt.replace("%A", "%a").replace("%B", "%b")
    print("FORMAT:%s / %s" % (fmt, str(shortName)))
    return time.strftime(fmt, t).replace('{D}', str(t.tm_mday)+dateEndings.get(t.tm_mday, 'th')).replace('{H}', str(hour))

def fixName(name, shortName=False):
    print("FIXNAME %s" % str(shortName));
    name=name.replace('_', ' ')
    parts=name.split('-')
    # Check for YYYY-MM-DD HH-MM-SS and return YYYY/MM/DD HH:MM:SS
    if 1==len(parts) and 2==len(name):
        # If it's a 2 digit month (e.g. 01) return the textual month name
        try:
            return time.strftime('%B', time.strptime(name, '%m'))
        except:
            return name
    elif 5==len(parts):
        # If its a date string, return a nicer representation
        
        # First check if its YYYY-MM-DD_HH-MM-SS_int
        nameParts = name.split(" ")
        if 3==len(nameParts):
            name=nameParts[0]+" "+nameParts[1]
        try:
            if name.endswith('xx-xx-xx'):
                return dateStr(time.strptime(name[:10], '%Y-%m-%d'), shortName=shortName)
            else:
                return timeStr(time.strptime(name.replace('xx', '00'), '%Y-%m-%d %H-%M-%S'), shortName=shortName)
        except:
            return parts[0]+'/'+parts[1]+'/'+parts[2]+':'+parts[3]+':'+parts[4]
    return name

def yearFromName(name):
    name=name.replace('_', '-')
    parts=name.split('-')
    if 6==len(parts):
        return parts[0]
    return undefined

def fileType(fileName):
    try:
        ext=fileName.rsplit('.', 1)[1].lower()
        if ("jpg"==ext) or ("png"==ext):
            return 'image'
        if "mp4"==ext or "mov"==ext or "m4v"==ext:
            return 'video'
    except:
        return None
    return None

def createDir(directory):
    if not os.path.exists(directory):
        log.info("Create "+directory)
        os.makedirs(directory, 0o755)
        if not os.path.exists(directory):
            return False
    return True

def timestamp(fileName):
    try:
        return os.path.getmtime(fileName)
    except OSError:
        return 0

def videoInfo(vid):
    try:
        out,_ = subprocess.Popen(["ffprobe", vid, "-print_format", "json", "-loglevel", "panic", "-show_streams"], stdout = subprocess.PIPE, stderr = subprocess.STDOUT).communicate()
        info = json.loads(out)
        duration = int(float(info["streams"][0]["duration"]))
        portrait = False
        if "tags" in info["streams"][0] and "rotate" in info["streams"][0]["tags"]:
            rotate = int(info["streams"][0]["tags"]["rotate"])
            if rotate == 90 or rotate == 270:
                portrait = True
        return duration, portrait
    except Exception as e:
        log.error("EX:"+str(e))
        return None, False

