#!/usr/bin/python
import sys
if sys.version_info < (2, 6):
    raise "Must use python version 2.6 or higher."

import subprocess, shutil, os, hashlib, urllib, urllib2, re, pwd, pdb, time, smtplib, socket, getpass, stat, string, json, datetime
from email.mime.text import MIMEText
from optparse import OptionParser
from tempfile import mkdtemp, mkstemp, NamedTemporaryFile
from cssmin import cssmin

LICENSE_PREAMBLE = '''
/*
 * Copyright 2010, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Additional Licenses for Third Party components can be found here:
 * http://wiki.freebase.com/wiki/Freebase_Site_License
 *
 */
'''

## EMAIL SETTINGS ##

USER_EMAIL_ADDRESS = "%s@google.com" % getpass.getuser()
DESTINATION_EMAIL_ADDRESS = "freebase-site@google.com"

## GLOBAL CONFIGURATION ##

SERVICES = {


  'otg' : { 'acre' : 'http://www.freebase.com',
            'www' : 'http://www.freebase.com',
            'freebaseapps' : 'freebaseapps.com'
            },
  'sandbox' : { 'acre' : 'http://www.sandbox-freebase.com',
                'www' : 'http://www.sandbox-freebase.com',
                'freebaseapps' : 'sandbox-freebaseapps.com'
                },
  'qa' : { 'acre' : 'http://acre.branch.qa.metaweb.com',
           'www' : 'http://branch.qa.metaweb.com',
           'freebaseapps' : 'branch.qa-freebaseapps.com'
           },
  'local' : { 'acre' : 'http://devel.sandbox-freebase.com:8115',
              'www' : 'http://www.sandbox-freebase.com',
              'freebaseapps' : 'acre.z.:8115'
              }
}

OUTBOUND = ["outbound01.ops.sjc1.metaweb.com", "outbound02.ops.sjc1.metaweb.com"]

# recognized extensions for static files
IMG_EXTENSIONS = [".png", ".gif", ".jpg"]
RES_EXTENSIONS = [".js", ".css", ".less"]
EXTENSIONS = IMG_EXTENSIONS + RES_EXTENSIONS + [".txt"]

FILE_TYPES = {
    'png':'image/png',
    'jpg':'image/jpeg',
    'gif':'image/gif',
    'html':'text/html',
    'css':'text/css',
    'js':'text/javascript'
    }

JAVA = os.environ.get("JAVA_EXE", "java")
COMPILER = os.path.join(os.path.abspath(os.path.dirname(os.path.join(os.getcwd(), __file__))), "compiler.jar")
JAVA_OPTS = ["-jar", COMPILER, "--warning_level", "QUIET"]

PRIVATE_SVN_URL_ROOT = 'https://svn.metaweb.com/svn/freebase_site'

ROOT_NAMESPACE = '/freebase/site'
CONFIG_FILE = 'CONFIG.json.json'
MANIFEST_FILE = 'MANIFEST.sjs'
METADATA_FILE = 'METADATA.sjs'
METADATA_LIB_FILE = 'METADATA.json'
FIRST_LINE_REQUIRE_CONFIG = 'var config = JSON.parse(acre.require("CONFIG.json").body);'

ACRE_ID_SVN_SUFFIX = ".svn.freebase-site.googlecode.dev"
ACRE_ID_GRAPH_SUFFIX = ".site.freebase.dev"
FREEBASE_API_KEY = "AIzaSyBblSNVmsgoamj9y5c5WdXMx9Xy4-O2fes"

class AppFactory:

  #this is an app:version -> app object mapping
  #we want to return the same app object for the same app:version combination
  #in order to keep useful state (e.g. to not re-checkout the app in svn etc..)
  #i.e. app objects are sigletons
  apps = { }

  def __init__(self, context):
    self.c = context

  #create an app object out of a path
  #e.g. //4.schema.site.freebase.dev
  def from_path(self, path):
      
    #separator = ACRE_ID_GRAPH_SUFFIX
    #if ACRE_ID_SVN_SUFFIX in path:  
    #separator = ACRE_ID_SVN_SUFFIX

    parts = path[2:].split(ACRE_ID_SVN_SUFFIX)[0].split('.')

    #if this was of the form <version or tag>.<app_key>.ID_SUFFIX
    if len(parts) == 4:
      #if this was an app tag of the form 16b.<app_key>.ID_SUFFIX
      matches = re.match('(\d+)(\D)$', parts[0])
      if matches:
          return self(parts[1], matches.group(1), matches.group(1) + matches.group(2))
      #this was an app branch of the form 16.<app_key>.ID_SUFFX
      return self(parts[1], parts[0])
    else:
      return self(parts[0], None)

  #return an App object
  def __call__(self, app_key, version=None, tag=None):

    if tag and not version:
      matches = re.match('(\d+)(\D)$', tag)
      if matches:
        return self(app_key, version = matches.group(1), tag=tag)
      else:
        return self.c.error('Could not create an app object out of app_key: %s app_tag: %s without an app version' % (app_key, tag))

    n = "%s:%s:%s" % (app_key, version or 'trunk', tag or 'none')
    if self.apps.get(n):
      return self.apps[n]

    app_obj = App(self.c, app_key, version, tag)

    self.apps[n] = app_obj
    return app_obj

class App:

  def __init__(self, context, app_key, version=None, tag=None):
    self.app_key = app_key
    self.version = version
    self.tag = tag

    self.app_id = '%s/%s' % (ROOT_NAMESPACE, self.app_key)

    self.context = context
    self.checked_out = False
    self.local_dir = None
    self.local_deployed_dir = None
    self.environment = None

    self.needs_static_generation = True
    self.pending_static_hash = None
    self.done_static_generation = False

  def __str__(self):
    if self.tag:
        return "%s:%s:%s" % (self.app_key, self.version, self.tag)
    elif self.version:
        return "%s:%s" % (self.app_key, self.version)
    else:
        return "%s:trunk" % self.app_key

  def path(self, short=False):

    suffix = ACRE_ID_SVN_SUFFIX
    if short:
        suffix = ''

    if self.tag:
      return "//%s.%s.www.tags%s" % (self.tag, self.app_key, suffix)
    elif self.version:
      return "//%s.%s.www.branches%s" % (self.version, self.app_key, suffix)
    else:
      return "//%s.www.trunk%s" % (self.app_key, suffix)


  def app_dir(self):
      
    parts = ACRE_ID_SVN_SUFFIX[1:].split('.')[0:-1]
    parts.reverse()

    if self.tag:
      parts.extend(['tags', 'www', self.app_key, self.tag])
    elif self.version:
      parts.extend(['branches', 'www', self.app_key, self.version])
    else:
      parts.extend(['trunk', 'www', self.app_key])

    return "/".join(parts)

  def get_app_files(self):
    '''
    returns a list of filenames routed at the top of the app
    e.g. ['index.mjt', 'mydir/foobar.sjs']
    '''
    files = []
    def scan_directory(directory = ''):
      
      for f in os.listdir(os.path.join(self.svn_path(), directory)):
        if f.startswith('.'):
          continue

        if os.path.isdir(os.path.join(self.svn_path(), directory, f)):
          scan_directory(os.path.join(directory, f))

        files.append(os.path.join(directory, f))
      

    scan_directory()
    return files

  def last_resource_revision(self):
    '''
    Will go through the revision of all resource files and return the latest one
    '''
    revision = 0
    cmd = ['svn', 'ls', '--verbose', self.svn_url()]
    (r, result) = self.context.run_cmd(cmd)

    if not r:
      return revision

    #the result is a series of lines like this:
    #  99777 kai              4178 Aug 12 16:18 loader-indicator-big.gif

    for v in result.split('\n'):
      parts = v.split(' ')

      #last part of the returned line is the filname
      filename = parts[-1]
      file_parts = filename.split('.')

      #does it have an extension
      if not len(file_parts) > 1:
        continue

      #is this a resource file
      if '.%s' % file_parts[-1] not in EXTENSIONS and file_parts[0] != 'CONFIG':
        continue

      if self.context.is_int(parts[3]) and int(parts[3]) > revision:
        revision = sint(parts[3])

    return revision


  def statify_css(self, filename):
    '''
    For a given filename, it will call the local acre instance
    to generate the concatanated css file, minify the result, 
    and then replace the file with the new contents in-place in the file system. 
    '''
    c = self.context
    file_url = "%s/%s" % (self.static_url(), filename)
    #write back to the *svn checkout directory - not to the local acre directory*
    response = c.fetch_url(file_url, acre=True)
    if not response:
      return c.error("Failed to get valid response from acre for %s" % file_url)

    file_contents = LICENSE_PREAMBLE + cssmin(''.join(response))
    return self.write_file(filename, file_contents)

  def statify_js(self, filename):
    '''
    For a given filename, it will call the local acre instance
    to generate the concatanated js file, run the result through the closure compiler
    and then replace the contents of the file in-place in the file system. 
    '''
    c = self.context
    file_url = "%s/%s" % (self.static_url(), filename)
    #write back to the *svn checkout directory - not to the local acre directory*
    response = c.fetch_url(file_url, acre=True)
    if not response:
        return c.error("Failed to get valid response from acre for url %s - aborting" % file_url)

    self.write_file(filename, ''.join(response))
    js_path = os.path.join(self.svn_path(), filename)
    status, temppath = mkstemp()
    fh = open(temppath, 'w')
    cmd = [JAVA] + JAVA_OPTS + ["--js", js_path]
    subprocess.call(cmd, stdout=fh)
    fh.close()
    fh = open(temppath)
    compiled_output = fh.read()
    if not compiled_output:
        return c.error('Failed to compile js file %s' % js_path)
    file_contents = LICENSE_PREAMBLE + compiled_output
    fh.close()
    return self.write_file(filename, file_contents)


  def statify(self):

    c = self.context

    #this will make sure that the manifest handler will parse .mf.* files
    result = self.update_handlers(static = False)

    if not result:
        return c.error('Cannot create static resources for %s - error opening/parsing the app metadata file' % self)
    self.copy_to_acre_dir()
    
    lib_app = self.lib_dependency()
    
    if lib_app:
      lib_app.copy_to_acre_dir()

    #app files will be a list of file paths starting at the app route 
    #i.e. app.svn_path()/<file> is the actual path on disk
    app_files = self.get_app_files()

    c.log('Creating static bundles for %s' % self, color=c.BLUE)

    static_files = []
    for filename in app_files:

      done = False

      if filename.endswith(".mf.css"):
        done = self.statify_css(filename)
        if not done:
          return c.error('Failed to generate static files, aborting.')

      elif filename.endswith(".mf.js"):
        done = self.statify_js(filename)
        if not done:
          return c.error('Failed to generate static files, aborting.')
        
      if done:
        static_files.append(filename)
    
    self.update_handlers(static = True, cache_forever = True)


    if not len(static_files):
        c.log('No static files generated')
        (r, result) = self.svn_commit(msg = 'updated static handlers and cache forever')
    else:
        (r, result) = self.svn_commit(msg = 'updated static handlers, cache forever, created static files:  %s' % ' '.join(static_files))

    if not r:
        return c.error("Failed to commit handlers and static files for %s" % self)

    return True


  def read_file(self, filename, isjson=False, warn=True):

    contents = ''

    svn_path = self.svn_path()
    if not svn_path:
        return (self.context.error('Cannot checkout the app from SVN'), contents)

    filename = "%s/%s" % (self.svn_path(), filename)

    try:
      fd = open(filename, 'r')
    except:
      if warn:
        self.context.warn('Cannot open file %s for reading (%s)' % (filename, self.svn_url()))
      return (False, contents)

    contents = fd.read()

    if isjson:
      try:
        contents = json.loads(contents)
      except:
        if warn:
          self.context.error('Cannot JSON parse the config file %s' % filename)
        fd.close()
        return (False, contents)
      
    fd.close()

    return (True, contents)


  def write_file(self, filename, contents):

    file_exists, _ = self.read_file(filename, warn=False)
    full_filename = "%s/%s" % (self.svn_path(), filename)

    try:
      fd = open(full_filename, 'w')
    except:
      self.context.warn('Cannot open file %s for writing' % filename)
      fd.close()
      return False

    fd.write(contents)
    fd.close()

    if not file_exists:
      svn_cmd = ['svn', 'add', full_filename]
      r = self.context.run_cmd(svn_cmd)
      if r:
        self.context.log('Added the file %s/%s to SVN' % (self.path(), filename))
      else:
        return self.context.error('Failed to add file %s/%s to SVN' % (self.path(), filename))

    return True

  def update_lib_dependency(self, app):
    '''
    update the dependency to the lib app of this app
    '''
    metadata = self.read_metadata()

    #fail silently if there is no metadata dependencies to update
    if not metadata or not ('mounts' in metadata.keys() and 'lib' in metadata['mounts'].keys()):
        return False

    metadata['mounts']['lib'] = app.path()

    #stamp the metadata file with additional useful SVN info
    metadata['app_key'] = self.app_key
    metadata['app_version'] = self.version
    metadata['app_tag'] = self.tag

    return self.write_metadata(metadata)

  def update_handlers(self, static = False, cache_forever = False):
    '''
    updates the metadata file to use the appropriate handlers for static files
    if static is False, it will use the manifest handlers for outputing mf.* style files dynamically
      this is the mode that we need when we generate static files when we create a tag
    if static is True, it will use the static handler for outputing pre-generated mf files and setting cache headers
      this is the mode that we need in production (i.e. in tagged apps)
    '''

    metadata = self.read_metadata()
    if not metadata:
        return self.context.error('Cannot open metadata file in order to update handlers')

    handlers =  {
        "mf.css": {
            "handler": "css_manifest",
            "media_type" : "text/css"
            },
        "mf.js": {
            "handler": "js_manifest",
            "media_type" : "text/javascript"
            },
        "omf.css": {
            "handler": "css_manifest",
            "media_type" : "text/css"
            },
        "omf.js": {
            "handler": "js_manifest",
            "media_type" : "text/javascript"
            }
        }

    if not metadata.get('extensions'):
        metadata['extensions'] = {}

    if static:
      #omf files never get the tagged_static handler
      handlers['mf.css']['handler'] = 'tagged_static'
      handlers['mf.js']['handler'] = 'tagged_static'
      metadata['extensions'].update(handlers)

      for file_extension in [x[1:] for x in IMG_EXTENSIONS]:
        if metadata['extensions'].get(file_extension):
          metadata['extensions'][file_extension].update({ 'handler' : 'tagged_binary' })
        else:
          metadata['extensions'][file_extension] = { 'handler' : 'tagged_binary', 'media_type' : 'image/%s' % file_extension }
    else:
      metadata['extensions'].update(handlers)  
            
    if cache_forever:
        metadata['ttl'] = -1

    return self.write_metadata(metadata)

  def lib_dependency(self):

    #the lib app does not have a dependency on itself
    if self.app_key == 'lib':
        return None

    metadata = self.read_metadata()

    if metadata == False:
        return False

    #check if there is a lib dependency in the metadata['mounts'] dictionary
    if not metadata or not ('mounts' in metadata.keys() and 'lib' in metadata['mounts'].keys()):
        return None

    #return the lib app object by constructing it from the app path
    return AppFactory(self.context).from_path(metadata['mounts']['lib'])


  def is_lib(self):
      return self.app_key == 'lib'

  def read_metadata(self, full_file_contents = False):
 
    filename = METADATA_FILE
    if self.is_lib():
        filename = METADATA_LIB_FILE
        
    (result, file_contents) = self.read_file(filename, isjson=False)
    if not result:
      return False


    contents = file_contents
    before = ''
    after = ''

    if not self.is_lib():
        res = re.match('(var METADATA\s?=\s?)([^;]*)(.*)', file_contents, re.DOTALL)
        if not res:
            return self.context.error('Cannot parse metadata file for %s' % self)

        before, contents, after = res.group(1), res.group(2), res.group(3)

    try: 
      metadata = json.loads(contents)
    except:
      return self.context.error('Cannot convert metadata file of %s to json' % self)


    if full_file_contents:
        return metadata, before, after

    return metadata

  def write_metadata(self, metadata):

    _, before, after = self.read_metadata(full_file_contents = True)

    filename = METADATA_FILE
    if self.is_lib():
        filename = METADATA_LIB_FILE

    return self.write_file(filename, ''.join([before, json.dumps(metadata, indent=2), after]))      


  def last_tag(self):
    '''
    Returns the last tag as a string or None if there are no tags
    e.g. '15b'
    '''

    (r, result) = self.context.run_cmd(['svn', 'ls', self.svn_url(alltags=True)])
    if not r:
        return None

    minor_tags = []

    for tag in result.split('/\n'):
        #e.g. 16a, 16b, etc...
        matches = re.match('(\d+)(\D)$', tag)
        if matches and self.context.is_int(matches.group(1)) and int(matches.group(1)) == int(self.version):
            minor_tags.append(matches.group(0))


    if not len(minor_tags):
        return None

    minor_tags.sort()
    return minor_tags[-1]

  def next_tag(self):
    '''
    Returns the next available tag as a string
    e.g. '15a'
    '''

    first_tag = "%sa" % self.version
    last_tag = self.last_tag()

    if not last_tag:
        return first_tag

    matches = re.match('\d+(\D)$', last_tag)
    return "%s%s" % (self.version, chr(ord(matches.group(1)) + 1))
      
  def create_tag(self, tag=None):
    '''
    Creates a new tag directory and copies the branched app there
    Returns an instance of the new app
    '''

    c = self.context

    if not tag:
        tag = self.next_tag()

    msg = '[sitedeploy] Creating tag %s' % tag

    target_app = AppFactory(c)(self.app_key, version=self.version, tag=tag)

    cmd = ['svn', 'copy', self.svn_url(), target_app.svn_url(), '--parents', '-m', msg, '--username', c.googlecode_username, '--password', c.googlecode_password]
    (r, output) = self.context.run_cmd(cmd)

    if not r:
        return r

    new_files = []
    for filename in target_app.get_app_files():
      if filename.endswith(".mf.css") or filename.endswith('.mf.js'):
        #manifest css and js files need special handling when creating a tag
        r = target_app.process_manifest_resource_file(filename)
          
        if not r:
          return r
        
        new_files.append(filename)


    if len(new_files):
        target_app.svn_commit(msg = 'Modified manifest resource files: %s' % ' '.join(new_files))

    return target_app


  def process_manifest_resource_file(self, filename):
    '''
    Given a filename of the form *.mf.{css,js} this function will:
    1. Substitute all references to other manifest files with their omf equivalent
    2. Create a copy of the manifest file to <original_filename>.omf.<original_extension>

    E.g. given the file path foo/bar.mf.css with contents "['lib/template/freebase.mf.css']"
    1. The contents of the file will become ['lib/template/freebase.omf.css']
    2. A second file will be created with the path foo/bar.omf.css with the new contents
       (i.e. both files will point to the omf versions of mf files)

    '''

    #nothing to do
    if not (filename.endswith('.mf.css') or filename.endswith('.mf.js')):
      return True

    c = self.context

    #utility function for converting a file path to a modified path
    #e.g. foo/bar.mf.css --> foo/bar.omf.css
    def get_modified_filename(f):
      path_parts = f.split('.mf.')
      return '.omf.'.join(path_parts)
        
    #first copy the file to the modified path
    target_filename = get_modified_filename(filename)
    (r, contents) = self.read_file(filename)

    if not r:
        return r

    new_mf_files = []
    rewrite = False    

    #now modify the manifest file in place to point to the converted files
    try:
      mf_files = json.loads(contents)
    except:
      #theoretically, the contents of a manifest file can be actual code (css or js)
      #so we have to pass silently here
      pass
    else:
      for file_path in mf_files:
        if file_path.endswith('.mf.css') or file_path.endswith('.mf.js'):
          new_file_path = get_modified_filename(file_path)
          rewrite = True
        else:
          new_file_path = file_path

        new_mf_files.append(new_file_path)
                  
      if rewrite:
          contents = json.dumps(new_mf_files)


    #always write the new converted filename
    r = self.write_file(target_filename, contents=contents)

    if not r:
        return r

    #if necessary, also overwrite the original file's contents
    if rewrite:
        return self.write_file(filename, contents = contents)
    
    return True

  def branch(self, target_version=None):

    c = self.context

    #figure out the next version if we were not given one
    if not target_version:
      target_version = self.next_svn_version()
      if not target_version:
        return c.error('Cannot figure out next valid version of %s to branch to' % self.app_key)
      else:
        c.verbose('Next available version for app %s is %s' % (self.app_key, target_version))

    target_app = AppFactory(c)(self.app_key, version=target_version)

    #if this version does not exist in svn, trying to get the local disk svn path will return false
    #this is forcing a checkout, but it's ok because we are going to need to do that anyway down the road
    path = target_app.svn_path(warn=False)

    if path:
      c.log('%s already exists in SVN - not branching' % target_app)
      return target_app

    msg = '[sitedeploy] Creating branch %s' % target_app
    c.log(msg, color=c.BLUE)
    cmd = ['svn', 'copy', self.svn_url(), target_app.svn_url(), '--parents', '-m', msg, '--username', c.googlecode_username, '--password', c.googlecode_password]
    (r, output) = c.run_cmd(cmd)

    if not r:
      return False

    return target_app

  def svn_commit(self, path=None, msg=None):

    c = self.context

    if path == None:
      path = self.svn_path()

    if not msg:
      msg = '[sitedeploy] committing ' % self
    else:
      msg = '[sitedeploy] %s' % msg

    cmd = ['svn', 'commit', '-m', msg, path, '--username', c.googlecode_username, '--password', c.googlecode_password]
    return c.run_cmd(cmd, name='commit app')


  def get_graph_app_from_environment(self, service):

    c = self.context

    s = c.get_freebase_services(service)
    if not s:
      return c.error('Unable to instantiate freebase services.')

    try:
      return s.get_app(self.path())
    except:
      return c.error('Could not get %s from appeditor services' % self)


  def get_graph_app(self, service=None):
    '''
    get app info using  graph/appeditor/get_app service
    '''
    try:
      graph_app = c.freebase.get_app(self.path())
    except:
      if not self.version:
        c.log("%s does not exist yet, will create it" % self.app_key)
        try:
          ActionCreateGraph(self.context)(self)
          graph_app = c.freebase.get_app(self.path())
        except:
          return c.error('Cannot create %s - aborting.' % self.app_key)
      else:
        raise

    return graph_app

  def last_svn_version(self):
    return int(self.next_svn_version() - 1)

  def next_svn_version(self):
    (r, result) = self.context.run_cmd(['svn', 'ls', self.svn_url(allversions=True)])

    versions = [int(v) for v in result.split('/\n') if self.context.is_int(v)]
    if len(versions):
      versions.sort()
      return int(versions[-1]) + 1

    return 1


  def svn_deployed_url(self, deployed_hash):
    return '{svn_url_root}/deployed/{app}/{deployed_hash}'.format(svn_url_root=PRIVATE_SVN_URL_ROOT, app=self.app_key, deployed_hash=deployed_hash)

  def svn_url(self, allversions=False, alltags=False):

    c = self.context

    if allversions:
        return '{svn_url_root}/branches/www/{app}'.format(svn_url_root=c.SITE_SVN_URL, app=self.app_key)
    elif alltags:
        return '{svn_url_root}/tags/www/{app}'.format(svn_url_root=c.SITE_SVN_URL, app=self.app_key)
    elif not self.version:
        return '{svn_url_root}/trunk/www/{app}'.format(svn_url_root=c.SITE_SVN_URL, app=self.app_key)
    elif not self.tag:
        return '{svn_url_root}/branches/www/{app}/{version}'.format(svn_url_root=c.SITE_SVN_URL, app=self.app_key, version=self.version)
    else:
        return '{svn_url_root}/tags/www/{app}/{tag}'.format(svn_url_root=c.SITE_SVN_URL, app=self.app_key, tag=self.tag)        


  def remove_from_svn(self):
    return self.context.run_cmd(['svn', 'rm', self.svn_url()])

  #will copy the app from its checked out directory to the target directory
  #and then get rid of the .svn directory
  #it will REMOVE the target directory before copying the app over first
  def copy(self, target_dir):

    c = self.context

    if os.path.isdir(target_dir):
      try:
        shutil.rmtree(target_dir)
      except:
        return c.error('Cannot copy app to existing directory %s (cannot delete directory first)' % self)

    #try:
    #  os.makedirs(target_dir)
    #except:
    #  return c.error('There was a problem creating the directory %s - cannot copy app to appengine directory.' % target_dir)

    path = self.svn_path()

    if not path:
        return c.error('Cannot copy %s to %s - svn checkout failed' % (self, target_dir))

    shutil.copytree(self.svn_path(), target_dir)
    
    def remove_unwanted_directories(directory = ''):
      
      for f in os.listdir(os.path.join(target_dir, directory)):
        if f.startswith('.'):
          #print "will delete %s" % os.path.join(target_dir, directory, f)
          shutil.rmtree(os.path.join(target_dir, directory, f))
          continue

        if os.path.isdir(os.path.join(target_dir, directory, f)):
          remove_unwanted_directories(os.path.join(directory, f))

    remove_unwanted_directories()

    return True

  def copy_to_acre_dir(self, war=False):

    target_dir = Acre.Get(self.context).site_dir(war=war) + '/' + self.app_dir()
    return self.copy(target_dir)

  #checks out the app from SVN into the specified directory
  def svn_checkout(self, target_dir, warn=True):

    c = self.context

    cmd = c.add_svn_credentials(['svn', 'checkout', self.svn_url(), target_dir])

    (r, output) = c.run_cmd(cmd, warn=warn)

    if not r:
      if warn:
          return c.error(output)
      else:
          return False

    return True

  #creates a directory and checks out the path
  #returns the directory where the app is checked out
  #the local path is remembered for future use
  def svn_path(self, warn=True):

    if self.checked_out:
      return self.local_dir

    if not self.local_dir:
      self.local_dir = mkdtemp()

    r = self.svn_checkout(self.local_dir, warn=warn)

    if not r:
      return False

    self.checked_out = True
    return self.local_dir

  def static_url(self):
    return "http://%s/static/%s" % (self.context.acre.url(), self.path(short=True)[2:])


class Context():
  BLUE = '\033[94m'
  GREEN = '\033[92m'
  RED = '\033[91m'
  ENDC = '\033[0m'

  ACRE_SVN_URL = 'https://acre.googlecode.com/svn'
  SITE_SVN_URL = 'https://freebase-site.googlecode.com/svn'

  start_time = None

  def __init__(self, options):
    self.options = options
    self.action = ''

    self.reminders = []
    #each dictionary entry is a HTTPMetawebSession object to a freebase graph
    #self.freebase = {}

    if getattr(options, 'graph', False):

      try:
        from freebase.api import HTTPMetawebSession, MetawebError
      except ImportError:
        return self.error("You need to install freebase-python for this operation. http://code.google.com/p/freebase-python/source/checkout")

      self.services = SERVICES[options.graph]
      self.freebase = self.get_freebase_services(SERVICES.get(options.graph, {}))
      self.freebase_logged_in = False


    try:
      from apiclient.discovery import build
    except ImportError:
      self.service = False
    finally:
      pass
      #self.service = build("freebase", "v1-dev", developerKey=FREEBASE_API_KEY)
        

    self.current_app = None
    self.app = None

    self.googlecode_username = None
    self.googlecode_password = None

    if getattr(self.options, 'app', False):
      self.current_app = self.app = AppFactory(self)(self.options.app, self.options.version, self.options.tag)

    self.quiet = False
    self.acre = None

    self.log_color = None

  def set_acre(self, acre):
    self.acre = acre

  def be_quiet(self):
    self.quiet = True

  def get_freebase_services(self,service):
    if 'www' in service.keys() and 'acre' in service.keys():
      return HTTPMetawebSession(service['www'], acre_service_url=service['acre'])

    return False

  def add_svn_credentials(self, cmd):
      if self.googlecode_username and self.googlecode_password:
          cmd.extend(['--username', self.googlecode_username, '--password', self.googlecode_password])
          
      return cmd

  def set_current_app(self, app):
    self.current_app = app

  def set_app(self, app):
    self.current_app = self.app = app

  def set_action(self, action):
    self.action = action

  def no_email(self):
    self.options.noemail = True

  def reminder(self, msg):
      self.reminders.append(msg)

  def warn(self, msg, subaction='WARNING'):
    return self.log(msg, subaction)

  def error(self, msg, subaction='ERROR'):
    self.log(msg, subaction, color=self.RED)
    return False

  def log(self, msg, subaction='', color=None, nocontext=False):

    #global color set - this might be None too
    if not color:
        color = self.log_color

    if self.quiet:
      return True

    if subaction:
      subaction = ":%s" % subaction

    start_color, end_color = '', ''
    if color:
      start_color, end_color = color, self.ENDC

    if nocontext:
        print >> sys.stderr, '%s %s%s' % (start_color,msg, end_color)
    else:
        print >> sys.stderr, '%s[%s:%s%s] %s%s' % (start_color, self.action, self.current_app or '', subaction, msg, end_color)

    return True


  def verbose(self, msg, subaction=None):
    if self.options.verbose and msg:
      return self.log(msg, subaction)

    return True

  def is_int(self, str):
    '''
    is str an int?
    '''
    try:
      int(str)
      return True
    except ValueError, e:
      return False

    
  def run_cmd(self, cmd, name='cmd', warn=True, interactive=False, silent=False):

    if not silent:
        self.log(' '.join(cmd), subaction=name)
    
    #interactive mode - stdout/stderr will go straight to the console
    if interactive:
        subprocess.Popen(cmd).communicate()
        return (True, '')
    
    #non-interactive mode, invocation will finish before output can be used
    stdout, stderr = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()

    if stderr:
        if warn:
            self.log(stderr, 'stderr')
        return (False, stderr)

    return (True, stdout)


  def read_config(self, filename):
    contents = None
    config = {}

    try:
      fh = open(filename, 'r')
      contents = fh.readlines()
    except:
      return self.error('Cannot open file %s for reading' % filename)
    finally:
      fh.close()

    if not len(contents):
        return self.error('Could not read %s' % filename)

    for line in contents:
      if len(line) <= 1 or line.startswith('#'):
        continue

      line = line.strip()
      (key, value) = line.split('=')

      value = value.replace("\"", "")

      config[key] = value

    return config


  def duration_human(self, date):
    seconds = date.seconds
    if not seconds:
        return '1 second'
    seconds = long(round(seconds))
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    days, hours = divmod(hours, 24)
    years, days = divmod(days, 365.242199)
 
    minutes = long(minutes)
    hours = long(hours)
    days = long(days)
    years = long(years)
 
    duration = []
    if years > 0:
        duration.append('%d year' % years + 's'*(years != 1))
    else:
        if days > 0:
            duration.append('%d day' % days + 's'*(days != 1))
        if hours > 0:
            duration.append('%d hour' % hours + 's'*(hours != 1))
        if minutes > 0:
            duration.append('%d minute' % minutes + 's'*(minutes != 1))
        if seconds > 0:
            duration.append('%d second' % seconds + 's'*(seconds != 1))
    return ' '.join(duration)


  def resolve_config(self):
    """Returns the configuration target.
    
    If the -c flag looks like a domain (has a dot) then try to figure out the configuration value
    by reading each config file and looking for the hostname. 

    Otherwise, just return the -c value. 

    """

    site_dir = self.resolve_site_dir()

    if not self.options.config:
        return self.error("You have to specify a valid configuration or hostname with -c.")


    actual_config = None

    # If the config value looks like a host - e.g. -c test.sandbox-freebase.com
    if len(self.options.config.split(".")) >= 2:

        # Find the appengine-config directory if it exists
        if os.path.isdir(os.path.join("..", "..", "appengine-config")):

            # Loop through all the files and find the project.*.conf files
            for f in os.listdir(os.path.join("..", "..", "appengine-config")):
                parts = f.split(".")
                if len(parts) > 1 and parts[0] == "project" and parts[-1] == "conf":
                    config = self.read_config(os.path.join("..", "..", "appengine-config", f))

                    # If this configuration value matches what was passed in, then the get the real config
                    # value from the filename of the project.<conf>.conf file. 
                    if config.get("ACRE_FREEBASE_SITE_ADDR", None) == self.options.config:
                        actual_config = parts[-2]
                        break


    if not actual_config:
        return self.error("Could not derive the actual configuration value from the host: %s." % self.options.config)

    self.options.config = actual_config
    return self.options.config

  def resolve_site_dir(self):
    """Returns the path to a freebase-site checkout directory"""

    if (not self.options.site_dir) and os.path.isdir(os.path.join("..", "..", "appengine-config")):
      self.options.site_dir = os.path.realpath(os.path.join("..", ".."))        

    return self.options.site_dir


  def fetch_url(self,url, isjson=False, tries=3, acre=False, silent=False, wait=1):

    #request = urllib2.Request(url, headers = {'Cache-control': 'no-cache' })
    request = urllib2.Request(url)
    contents = None
    while tries > 0:
      try:
        self.log(url, 'fetchurl')
        fd = urllib2.urlopen(request, timeout=30.0)
        contents = []
        for l in fd:
            contents.append(l)
        break
      except Exception as ex:
          self.log('fetchurl failed: Trying with curl binary...')
          outlog = NamedTemporaryFile()
          subprocess.Popen(['curl', '-s', url], stdout=outlog, stderr=outlog).wait()
          fd = open(outlog.name)
          contents = fd.readlines()
          fd.close()

          if not len(contents):
              if not silent:
                  self.error("%s\n%s" % (url, str(ex)), subaction='fetch url error')
              if acre and not 'connection reset by peer' in str(ex):
                  Acre.Get(self).display_error_log(url)
              if tries:
                  tries -= 1
                  time.sleep(wait)
              if not silent:
                  self.log('Trying again....')
          else:
              break

          
    if isjson and contents:
        return json.loads(''.join(contents))

    return contents

  def remember_data(self, data, site, key):

     filename = os.path.join(os.environ['HOME'], '.%s_appdeploy_%s' % (site, key))

     try:
         fd = open(filename, "w")
         fd.write(data)
         fd.close()
     except:
         #silently fail here - this is just a convenience function
         return False

     #give the user rw permissions but not to group or other
     os.chmod(filename, stat.S_IRUSR | stat.S_IWUSR)

     return True


  def retrieve_data(self, site, key):

     data = ''
     filename = os.path.join(os.environ['HOME'], '.%s_appdeploy_%s' % (site, key))

     try:
         fd = open(filename, "r")
         data = fd.readline()
         fd.close()
     except:
         #silently fail here - this is just a convenience function
         pass

     return data


  def freebase_login(self):

    if self.freebase_logged_in:
      return True

    try:
      if not self.options.user:
        username = self.retrieve_data(site='freebase', key='username')
        user = raw_input("Freebase Username (%s): " % username)

        if not user and username:
          user = username
        elif user:
          self.remember_data(user, site='freebase', key='username')
      else:
        user = self.options.user

      pw = getpass.getpass()
    except KeyboardInterrupt:
      return self.error('Could not log in to freebase with these credentials.')

    try:
        self.freebase.login(user, pw)
    except:
        return self.error('Could not log in to freebase with these credentials.')

    self.freebase_logged_in = True
    return True


  def googlecode_login(self):

    if self.googlecode_username and self.googlecode_password:
      return True

    username = None
    password = None

    try:
      #USERNAME
      stored_username = self.retrieve_data(site='googlecode', key='username')
      if self.options.user:
          stored_username = self.options.user
      entered_username = None

      if not stored_username:
          entered_username = raw_input("GoogleCode Username (%s): " % stored_username)

      if not entered_username and stored_username:
        username = stored_username
      elif entered_username:
        self.remember_data(entered_username, site='googlecode', key='username')
        username = entered_username
      else:
        return self.error("You must provide valid credentials for Google Code SVN.")

      #PASSWORD
      stored_password = self.retrieve_data(site='googlecode', key='password')
      if not stored_password:
        entered_password = getpass.getpass()

        if not entered_password:
          return self.error("You must provide valid credentials for Google Code SVN.")

        password = entered_password
        self.remember_data(entered_password, site='googlecode', key='password')
      else:
        password = stored_password

    except KeyboardInterrupt:
      return self.error("You must provide valid credentials for Google Code SVN.")


    self.googlecode_username = username
    self.googlecode_password = password

    return True



  def mqlread(self, query, params=None):
    #if not self.service:
    #  return self.error("Sorry, no python apiclient installed: http://code.google.com/p/google-api-python-client/wiki/Installation")
    #return self.service.mqlread()

    if not params:
      params = {}

    params['query'] = json.dumps(query)
    params['key'] = FREEBASE_API_KEY
    url = "https://www.googleapis.com/freebase/v1/mqlread?%s" % urllib.urlencode(params)

    return self.fetch_url(url, isjson=True)


  def hash_for_file(self,f, block_size=2**20):
    md5 = hashlib.md5()
    while True:
        data = f.read(block_size)
        if not data:
            break
        md5.update(data)
    return md5.hexdigest()


  def send_email(self):

    s = []
    s.append('The following deployment finished succesfully: \n')
    s.append('operator:\t%s\n' % os.getlogin())
    s.append('action:\t%s\n' % self.action)
    s.append('app:\t%s\n' % self.current_app)
    s.append('graph:\t%s\n' % (self.options.graph or ''))

    msg = MIMEText(''.join(s))
    msg['Subject'] = '[appdeploy] success: %s of %s to %s' % (self.action, self.current_app, self.options.graph or '')
    msg['To'] = DESTINATION_EMAIL_ADDRESS
    msg['From'] = USER_EMAIL_ADDRESS

    try:
      #set the socket timeout to 5 seconds in case there is no smtp server responding
      #socket.setdefaulttimeout(5)
      server = smtplib.SMTP()
      server.connect('smtp')
      server.sendmail(USER_EMAIL_ADDRESS, [DESTINATION_EMAIL_ADDRESS], msg.as_string())
    except:
      self.warn('No deployment e-mail sent - error while sending email')
      return False

    return True


  def symlink(self, source, destination):

    if os.path.islink(destination):
      return True

    if os.path.exists(destination):
      return self.log('The destination symlink %s you are trying to create already exists' % destination)

    try:
      os.symlink(source, destination)
    except:
      return self.error('Error creating symlink %s ---> %s' % (destination, source))

    self.log('%s  --->  %s' % (destination, source), subaction='symlink')

    return True


class Acre:
  '''Represents a local acre instance'''

  _standard_port = "8121"

  #local acre should be a singleton across the session
  _acre_instance = None

  def __init__(self, context):
    self.context = context
    self.host_url = None

    self._acre_dir = None
    if context.options.acre_dir:
        self._acre_dir = context.options.acre_dir

    #will hold instances of Popen objects
    #these are handlers to the current running acre process
    self._acre_process = None

    self.log = NamedTemporaryFile()


  @classmethod
  def Checkout(cls, context, acre_version, target_dir=None):

    c = context

    success = c.googlecode_login()
    if not success:
      return c.error('You must provide valid google code credentials to complete this operation.')

    try:
      if target_dir:
        if os.path.isdir(target_dir):
          return c.error("The directory %s that you specified already exists. Cannot checkout acre in an existing directory.")
        else:
          os.mkdir(target_dir)

      else:
        dir_suffix = "-acre-%s-%s" % (acre_version, str(datetime.datetime.now())[:19].replace(" ", "-").replace(":", "-"))
        target_dir = mkdtemp(suffix=dir_suffix)

    except:
      return c.error("Unable to create directory %s" % target_dir)
    

    path = "/trunk"
    if not (acre_version == "trunk"):
        path = "/dev/%s" % acre_version

    svn = SVNLocation(c, c.ACRE_SVN_URL + path, target_dir)
 
    c.log('Starting acre checkout')
    try:
        r = svn.checkout()
    except:
        return c.error("Error on acre svn checkout.")

    if not r:
      return False

    c.log('Acre checkout done')

    return target_dir

  @classmethod
  def Get(cls, context, existing=False):
    """Returns an acre object - persistent across request.

    If --acre_version is passed, an svn checkout will be attempted.
    The destination directory will be a temporary directory, or the --acre_dir if passed. 
    else if --acre_dir is passed, an acre object will be returned immediately. 
    
    Returns:
      An acre object if succesful. False if not.
      
    """

    if cls._acre_instance:
      return cls._acre_instance

    # If we were asked for an existing Acre object only, don't attempt to fetch acre from SVN. 
    if existing:
        return False

    if not (context.options.acre_dir or context.options.acre_version):
        return context.error("In order to use Acre you have to specify at least one of \n- a valid directory with --acre_dir \n- a valid acre svn version ('trunk' or a branch name) with --acre_version.\nSpecifying both with checkout acre in the directory specified.")

    # If --acre_version was passed in command line, try to fetch acre from SVN
    # Install in --acre_dir or in a new temporary directory.
    v = context.options.acre_version
    
    if v:
      acre_dir = Acre.Checkout(context, v, context.options.acre_dir)
      if acre_dir:
        context.options.acre_dir = acre_dir
      else:
        return False

    # By this point, either --acre_dir was passed in with a valid acre directory
    # or we did an svn checkout and set acre_dir to the new directory.
    # If it's not set - we have a problem.
    if not context.options.acre_dir:
        return context.error("Unable to create Acre object - no directory specified.")
            
    cls._acre_instance = cls(context)
    return cls._acre_instance

  def build(self, target = None, config_dir = None, war=False):

    c = self.context
    c.log("Building acre under %s" % self._acre_dir)
    os.chdir(self._acre_dir)

    #by default, build for local appengine
    build_mode = "appengine-build"
    if war:
        build_mode = "appengine-build-war"

    if target and config_dir and os.path.isdir(config_dir):
      cmd = ["./acre", "-c", target, "-d", config_dir, "appengine-build-config"]
      (r, result) = c.run_cmd(cmd)

      if not r:
        return c.error("Failed to configure acre."), result

    cmd = ["./acre", build_mode]
    if target and config_dir and os.path.isdir(config_dir):
        cmd = ["./acre", "-c", target, "-d", config_dir, build_mode]

    (r, result) = c.run_cmd(cmd)

    if not r:
        return c.error("Failed to build acre."), result

    return r, result
      
  def deploy(self, target = None):
      
      c = self.context

      os.chdir(self._acre_dir)

      config_dir = os.path.join(c.options.site_dir, 'appengine-config')

      cmd = ['./acre', '-c', target, '-d', config_dir, 'appengine-deploy']
      self.context.run_cmd(cmd, interactive=True)
      return True


  def start(self, war=False):

      c = self.context

      self.stop()
      
      bundle = "%s/webapp" % self._acre_dir
      if war:
          bundle = "%s/_build/war" % self._acre_dir

      c.log('Starting Acre dir[%s] port[%s] log[%s]' % (bundle, self._standard_port, self.log.name), color=c.BLUE)
      
      if not os.environ['APPENGINE_HOME']:
          return c.error('The environment variable APPENGINE_HOME must point to your AppEngine SDK directory')

      cmd = ['%s/bin/dev_appserver.sh' % os.environ['APPENGINE_HOME'], '--disable_update_check', '--port=%s' % self._standard_port, bundle]
      c.log(' '.join(cmd), subaction='cmd')
      try:
          self._acre_process = subprocess.Popen(cmd, stdout=self.log, stderr=self.log)
          #wait a bit for acre to start
          time.sleep(5)
          #and then keep trying to hit it until we get a valid response

          while not self.is_running():
              c.log('Still waiting for acre to start...')
          c.log('Acre started succesfully')
      except:
          c.error('There was an error starting the acre process')
          raise

      if self._acre_process:
          return True

      return False

  def stop(self):

    if self._acre_process:
      self.context.log('Stoping Acre', color=self.context.BLUE)
      self._acre_process.kill()
      self._acre_process = None

    self.kill_running_acre()

    return True


  def prepare_failover(self):
    '''
    We have to do 2 things:
    1. Substitute the version in _build/war/WEB-INF/web.xml to 'failover' 
    2. Bundle the environments freebase-site directory in the _build/war
    '''
    c = self.context

    #Mark the version as failover
    filename = self.acre_dir(war=True) + "/WEB-INF/appengine-web.xml"
    try:
      #open and read the existing file
      fd = open(filename)
      lines = fd.readlines()
      fd.close()
      #re-open the file in write mode and write all the existing data
      #but substitute the version with 'failover'
      fd = open(filename, "w")
      for line in lines:
        if line.strip()  == "<version>live</version>":
            fd.write("\t<version>failover</version>\n")
        else:
            fd.write(line)
              
      fd.close()
    except Exception as ex:
        return c.error("Failed to overwrite file %s:\n%s" % (filename, str(ex)))
    
    c.log('Changed version to failover in %s' % filename)


    #Copy the environments directory into the correct place


    svn_url = c.SITE_SVN_URL + "/environments"
    parts = ACRE_ID_SVN_SUFFIX[1:].split('.')[0:-1]
    parts.reverse()
    
    target_dir = os.path.join(self.acre_dir(war=True), "WEB-INF/scripts", *parts)
    target_dir = os.path.join(target_dir, 'environments')

    if os.path.isdir(target_dir):
      shutil.rmtree(target_dir)

    cmd = ['svn', 'checkout', svn_url, target_dir]
    r = c.run_cmd(cmd)

    if not r:
        return c.error('Failed to svn checkout %s into %s' % (svn_url, target_dir))

    shutil.rmtree(target_dir + '/.svn')

    c.log('Copied freebase-site environments file into acre: %s' % target_dir)

    return True


  def read_config(self, war=False):
    '''
    Reads the acre project.local.conf and returns its property/value pairs as a dictionary
    '''

    c = self.context
    war_path = 'webapp'
    if war:
        war_path = '_build/war'
    filename = os.path.join(self._acre_dir, war_path, 'META-INF', 'acre.properties')

    return c.read_config(filename)

  def kill_running_acre(self):
    '''
    kills a running acre on appengine instance by looking at running processes
    useful to kill stranglers that stayed up after a previous script invocation
    '''

    c = self.context
    cmd = ['ps', 'wax']
    (r, contents) = c.run_cmd(cmd, silent=True)
    
    for line in contents.split('\n'):

      #poor man's running acre under appengine detection
      if '--port=%s' % self._standard_port in line and 'appengine' in line and 'acre' in line:
        r = c.run_cmd(['kill', line.split()[0]], silent=True)
        time.sleep(1)
        return r
      

  def find_running_acre(self):
    c = self.context
    cmd = ['ps', 'wax']
    (r, contents) = c.run_cmd(cmd)
    
    if not r:
        return self._acre_dir
    
    for line in contents.split('\n'):

      parts = line.split()
      if not len(parts):
          continue

      if len(parts) > 11 and 'appengine-java-sdk' in parts[6] and 'acre' in parts[13]:
          self._acre_dir = '/'.join(parts[13].split('/')[:-1])
          break

      if parts[-1] == 'com.google.acre.Main':
        try: 
          for i, v in enumerate(parts):
            if v == '-cp':
              dir_parts = parts[i+1].split('/')
              self._acre_dir =  '/'.join(dir_parts[:dir_parts.index('library')])
              c.log("Will use acre instance under %s that is currently running." % self._acre_dir, color=c.BLUE)
              break
        except:
          #something went wrong while parsing the ps line, just fail silently and let the user define the acre_dir
          continue


      if self._acre_dir: 
          return True

      return False

  def acre_dir(self, war=False):
      
    if not self._acre_dir:
        self.find_running_acre()

    if self._acre_dir:
      if war:
        return self._acre_dir + "/_build/war"
      else:
        return self._acre_dir + "/webapp"


    return c.error('Could not find acre directory - none specified in command line, and no running acre on appengine process found.')

  def fs_routed_apps(self):
    '''
    Returns a list of app objects that are used by the environment file of this acre/fs instance
    '''

    c = self.context
    if not self.acre_dir():
      return c.error("You have not specified an acre directory with --acre_dir and a running acre instance could not be found")

    acre_url = self.url()
    if not acre_url:
        return False

    url = "http://%s/_fs_routing" % acre_url
      
    response = c.fetch_url(url, acre=True)
    
    if not response:
        return c.error("There is no acre running: %s" % url)

    try:
      routing_table = json.loads(''.join(response))
    except:
      return c.error('Failed to parse the routing table')

    apps = set()

    for label, app_id in routing_table.get('apps').iteritems():
        if ACRE_ID_SVN_SUFFIX in app_id:
            app = AppFactory(c).from_path(app_id)
            apps.add(app)

            lib_dependency = app.lib_dependency()
            if lib_dependency:
                apps.add(lib_dependency)

    return apps


  def is_running(self, war=False):

    c = self.context

    if not self.acre_dir():
      return c.error("You have not specified an acre directory with --acre_dir and a running acre instance could not be found")

    acre_url = self.url(war)
    if not acre_url:
        return False

    url = "http://%s/_fs_routing" % acre_url

    response = c.fetch_url(url, acre=True, silent=True, wait=2)
    
    if not response:
        c.log("There is no acre running: %s" % url)
        return False

    return response


  def url(self, war=False):
    if self.host_url:
      return self.host_url

    acre_config = self.read_config(war)
    self.host_url = "devel.%s:%s" % (acre_config.get('ACRE_METAWEB_BASE_ADDR'), self._standard_port)

    return self.host_url



  def site_dir(self, war=False):
    '''Returns the acre scripts directory under the specified acre instance'''

    #App Engine directory location
    #target_dir = self.acre_dir + '/_build/war/WEB-INF/scripts'
    #Jetty/Acre directory location
    target_dir = self.acre_dir(war) + '/WEB-INF/scripts'

    if not os.path.isdir(target_dir):
      try:
        os.makedirs(target_dir)
      except:
        return c.error('There was a problem creating the directory %s' % target_dir)

    return target_dir

  def display_error_log(self, url):

      c = self.context
      fd = open(self.log.name)

      in_request = False
      
      if url.startswith('http://'):
          url = url[7:]

      request_logs = []

      for line in fd:

          color = None
          line = line.rstrip()
          if 'com.google.acre.logging.AcreLogger log' in line:
              continue
          elif line.startswith('INFO [****** request *******]') and url in line:
              #reset the request logs so it will only hold the last request of this url
              request_logs = []
              in_request = True
              color = c.BLUE
          elif '[request.end]' in line:
              in_request = False
              color = c.BLUE
          elif not in_request:
              continue


          if line.startswith('ERROR') or line.startswith('SEVERE') or line.startswith('WARNING'):
              color = c.RED

          request_logs.append((line, color))

      fd.close()      

      for line, color in request_logs:
          c.log(line, color=color, nocontext=True)
              


class SVNLocation:

  def __init__(self, context, svn_url=None, local_dir=None):
    self.context = context

    self.svn_url = svn_url
    self.local_dir = local_dir

  def checkout(self, files=False):
    c = self.context

    cmd = ['svn', 'checkout', self.svn_url, self.local_dir, '--username', c.googlecode_username, '--password', c.googlecode_password]
    if files:
      cmd.extend(['--depth', 'files'])
    (r, result) = c.run_cmd(cmd)

    if not r:
      if "svn: invalid option" in result:
        c.error("You might have an older version of svn - please update to the latest version. The option --depth is not supported in your version.")
      return c.error(result)

    return True


  def update(self):
    '''Returns the last revision or False'''
    c = self.context

    cmd = ['svn', 'update', self.local_dir, '--username', c.googlecode_username, '--password', c.googlecode_password]
    (r, result) = c.run_cmd(cmd)

    if not r:
      return c.error(result)

    return (r, result)



              
              



