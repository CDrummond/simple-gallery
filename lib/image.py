#
# Gallery WebApp
# Copyright 2019-2022 Craig Drummond <craig.p.drummond@gmail.com>
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
        thumbPos = 0
        duration, portrait = utils.videoInfo(source)
        if duration > 10:
            thumbPos = 5
        elif duration > 2:
            thumbPos = 1
        if portrait and config.portraitVideoBlackBars and config.scaledSize == size:
            # Add black bars
            vidSize=size.replace("x", ":")
            subprocess.call([config.ffmpeg, '-loglevel', 'panic', '-i', source, '-vframes', '1', '-an', '-ss', str(thumbPos), "-qscale:v", "8",
                            "-vf", "scale=%s:force_original_aspect_ratio=decrease,pad=%s:(ow-iw)/2:(oh-ih)/2,setsar=1" % (vidSize, vidSize), dest])
        else:
            subprocess.call([config.ffmpeg, '-loglevel', 'panic', '-i', source, '-vframes', '1', '-an', '-ss', str(thumbPos), ffmpegTmp])
            subprocess.call([config.convert, "-resize", size+">", "-quality", str(quality), ffmpegTmp, dest])
        if os.path.exists(ffmpegTmp):
            os.remove(ffmpegTmp)
    return os.path.exists(dest)
