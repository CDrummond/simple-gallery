#
# Gallery WebApp
# Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
# Licensed under the MIT license.
#

import os
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

def dateStr(t):
    return timeStr(t, '%A {D} %B %Y')

def timeStr(t, fmt='%A {D} %B %Y, {H}:%M %p'):
    hour=t.tm_hour
    if hour>12:
        hour-=12
    return time.strftime(fmt, t).replace('{D}', str(t.tm_mday)+dateEndings.get(t.tm_mday, 'th')).replace('{H}', str(hour))

def fixName(name):
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
                return dateStr(time.strptime(name[:10], '%Y-%m-%d'))
            else:
                return timeStr(time.strptime(name.replace('xx', '00'), '%Y-%m-%d %H-%M-%S'))
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
        os.makedirs(directory, 0755)
        if not os.path.exists(directory):
            return False
    return True

def timestamp(fileName):
    try:
        return os.path.getmtime(fileName)
    except OSError:
        return 0

def createImge(source, dest, fType, size, quality):
    if os.path.exists(dest):
        return True

    if not os.path.exists(source):
        video=utils.removeExtension(source)+".mp4"
        if os.path.exists(source):
            source=video
    log.info("Creating "+dest+" @"+size+" for "+source)
    if 'image'==fType:
        subprocess.call([config.convert, "-auto-orient", "-resize", size+">", "-quality", str(quality), source, dest])
    else:
        ffmpegTmp=dest+".tmp.png"
        if os.path.exists(ffmpegTmp):
            os.remove(ffmpegTmp)
        subprocess.call([config.ffmpeg, '-loglevel', 'panic', '-i', source, '-vframes', '1', '-an', ffmpegTmp])
        subprocess.call([config.convert, "-resize", size+">", "-quality", str(quality), ffmpegTmp, dest])
        if os.path.exists(ffmpegTmp):
            os.remove(ffmpegTmp)
    return os.path.exists(dest)
