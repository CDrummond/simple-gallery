#
# Gallery WebApp
# Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
# Licensed under the MIT license.
#

import json
import os
import datetime
import re
from . import config
from . import utils
from . import log
from flask import Blueprint, abort, request

api = Blueprint(__name__, __name__)

def resolveLink(path, entry):
    #if not path.endswith('/'):
    #    path+='/'
    #filePath=config.sourceFolder+path+entry
    #if os.path.islink(filePath):
    #    link=os.readlink(filePath)
    #    linkParts=link.split('/')
    #    pathParts=path.split('/')
    #    if len(linkParts)>len(pathParts):
    #        newPath=""
    #        atStart=True
    #        for part in range(0, len(linkParts)-1):
    #            if not atStart:
    #                newPath+=linkParts[part]+'/'
    #            elif '..'!=linkParts[part]:
    #                atStart=False
    #                newPath+=linkParts[part]+'/'
    #        newPath+=linkParts[-1]
    #        if os.path.exists(config.sourceFolder+newPath):
    #            return newPath
    return path+entry

MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

def saveInfo(directory, thumb):
    # TODO: In future might save more info to JSON file, so need to read prev contents
    if utils.createDir(config.cacheFolder+directory):
        infoFile = config.cacheFolder+directory+"info.json"
        with open(infoFile, 'w') as f:
            json.dump({'thumb':thumb}, f)
            
def findFirstImage(directory):
    infoFile = config.cacheFolder+directory+"info.json"
    if os.path.exists(infoFile):
        try:
            with open(infoFile) as f:
                fileName = json.load(f)['thumb']
                if os.path.exists(config.sourceFolder+directory+fileName):
                    log.info("Got thumb for %s from info" % directory)
                    res=utils.removeExtension(resolveLink(directory, fileName))+".jpg"
                    if res.startswith("/"):
                        return res[1:]
                    return res
        except:
            log.error("Failed to parse/load info.json")
            pass
        
    images=[]
    videos=[]
    sub=[]
    for entry in os.listdir(config.sourceFolder+directory):
        if os.path.isdir(config.sourceFolder+directory+entry):
            sub.append(entry)
        else:
            fType=utils.fileType(entry)
            if 'image'==fType:
                images.append(entry)
            elif 'video'==fType:
                videos.append(entry)
    if len(images)>0:
        images.sort()
        saveInfo(directory, images[0])
        return resolveLink(directory, images[0])
    if len(videos)>0:
        videos.sort()
        saveInfo(directory, videos[0])
        return resolveLink(directory, videos[0])
    
    sub.sort()
    candidates=[]
    for s in sub:
        image=findFirstImage(directory+s+"/")
        if None!=image:
            # Remove any leading /
            if image.startswith('/'):
                image=image[1:]
            if None!=image:
                parts=image.split('/')
                name=parts[-1]
                parts.pop()
                candidate={}
                candidate['parts']=parts
                candidate['name']=name
                candidates.append(candidate)
    if len(candidates)>0:
        candidates=sorted(candidates, key=lambda k: k['name'])

        dirParts = len(filter(None, directory.split("/")))
        image='/'.join(candidates[0]['parts'][dirParts:])+'/'+candidates[0]['name']
        saveInfo(directory, image)
        res=resolveLink(directory, image)
        if res.startswith("/"):
            res=res[1:]
        return res
    return None

def isYear(s):
    try:
        i = int(s)
        return i>1900 and i<3000
    except:
        return False

def getItems(path, ignoreFolders, filt, shortNames):
    subDirs=[]
    images=[]
    if not path.endswith('/'):
        path+='/'
    for entry in os.listdir(config.sourceFolder+path):
        if None!=ignoreFolders and entry in ignoreFolders:
            continue
        log.info("Entry "+entry)
        item={}
        item['url'] = resolveLink(path, entry)
        item['sort'] = entry
        if os.path.isdir(config.sourceFolder+path+entry):
            if 'all'==filt:
                d, i = getItems(path+entry, ignoreFolders, filt, shortNames)
                images += i
            else:
                item['name']=utils.fixName(entry, shortNames)
                item['thumb']=findFirstImage(path+entry+'/')
                if isYear(item['name']):
                    item['sort']="A:"+str(3000-int(item['name']))
                elif item['name'] in MONTHS:
                    parts = utils.fileNameNoExt(item['thumb']).split('-')
                    item['sort'] = "B:%s.%02d.00" % (parts[0], MONTHS.index(item['name'])+1)
                elif item['thumb']:
                    try:
                        parts = utils.fileNameNoExt(item['thumb']).split('-')
                        item['sort'] = "B:%s.%s.%s" % (parts[0], parts[1], parts[2])
                    except:
                        log.error('Failed to decode thumb %s' % item['thumb'])
                #log.info("XXXXXX %s => %s" % (item['name'], item['sort']))
                if (item['thumb']):
                    subDirs.append(item)
        else:
            fType=utils.fileType(entry)
            if fType:
                item['name']=utils.fixName(utils.removeExtension(entry), shortNames)
                item['video']='video'==fType
                images.append(item)
    return subDirs, images

def getImages(path, ignoreFolders, regex, shortNames):
    images=[]
    if not path.endswith('/'):
        path+='/'
    for entry in os.listdir(config.sourceFolder+path):
        if None!=ignoreFolders and entry in ignoreFolders:
            continue
        log.info("Entry "+entry)
        if os.path.isdir(config.sourceFolder+path+entry):
            images += getImages(path+entry, ignoreFolders, regex, shortNames)
        elif re.findall(regex, entry):
            fType=utils.fileType(entry)
            if fType:
                fName = utils.removeExtension(entry)
                item={}
                item['url'] = resolveLink(path, entry)
                item['sort'] = entry
                item['name']=utils.fixName(fName, shortNames)
                item['video']='video'==fType
                item['year']=utils.yearFromName(fName)
                images.append(item)
    return images

def getJson(path, ignoreFolders, filt, shortNames):
    if filt=='today':
        subDirs = []
        images = getImages(path, ignoreFolders, datetime.datetime.today().strftime('^[0-9]{4}-%m-%d_'), shortNames)
    else:
        subDirs, images = getItems(path, ignoreFolders, filt, shortNames)
    subDirs=sorted(subDirs, key=lambda k: k['sort'])
    images=sorted(images, key=lambda k: k['sort'])
    response={}
    if None!=subDirs:
        response['dirs']=subDirs
    if None!=images:
        response['images']=images

    return json.dumps(response, separators=(',',':'))

@api.route('/')
def root():
    filt = request.args.get('filter')
    shortNames = True if request.args.get('short') == '1' else False
    log.info("Browse <root>")
    return getJson('', config.ignoreFolders, filt, shortNames), 200, {'Content-Type': 'application/json; charset=utf-8'}

@api.route('/<path:path>')
def folder(path):
    filt = request.args.get('filter')
    shortNames = True if request.args.get('short') == '1' else False
    log.info("Browse "+path)
    if ('/../' in path):
        abort(403)
        return
    return getJson(path, None, filt, shortNames), 200, {'Content-Type': 'application/json; charset=utf-8'}

