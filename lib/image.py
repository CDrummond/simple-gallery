#
# Gallery WebApp
# Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
# Licensed under the MIT license.
#

import os
import subprocess
from . import config
from . import log
from . import utils

def createImage(source, dest, fType, size, quality):
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
