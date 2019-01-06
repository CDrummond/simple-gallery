#
# Gallery Thumbnail Generator
# Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
# Licensed under the MIT license.
#

import os

from . import log
from . import image
from . import utils
from . import config
from . import browse_api

def getItems(path, ignoreFolders):
    subDirs=[]
    images=[]
    videos=[]
    if '' != path and not path.endswith('/'):
        path+='/'

    for entry in os.listdir(config.sourceFolder+path):
        if None!=ignoreFolders and entry in ignoreFolders:
            continue
        log.info("Entry "+entry)
        url=browse_api.resolveLink(path, entry)
        if os.path.isdir(config.sourceFolder+path+entry):
            subDirs.append(url)
        else:
            fType=utils.fileType(entry)
            if 'image'==fType:
                images.append(url)
            elif 'video'==fType:
                videos.append(url)
    return subDirs, images, videos

def genImages(path, fType):
    log.info("Thumb "+path)
    fullPath=config.cacheFolder+path
    if not utils.createDir(os.path.dirname(fullPath)):
        log.error("Failed to create folder for "+path)
        return
    thumbName=utils.removeExtension(fullPath)+config.thumbSuffix
    image.createImage(config.sourceFolder+path, thumbName, fType, config.thumbSize, config.thumbQuality)
    scaledName=utils.removeExtension(fullPath)+config.scaledSuffix
    image.createImage(config.sourceFolder+path, scaledName, fType, config.scaledSize, config.scaledQuality)

def createCachedImages(path):
    log.info("Create cached images in "+path)
    subDirs, images, videos = getItems(path, config.ignoreFolders)
    for sub in subDirs:
        createCachedImages(sub)
    for img in images:
        genImages(img, 'image')
    for img in videos:
        genImages(img, 'video')

