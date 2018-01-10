import json
import os
import shutil
import sys
import pkg_resources

from setuptools import Command, find_packages, setup

ROOT_MODULE = 'backendapp'


def fpath(name):
    '''
    Return path relative to the directory of setup.py.
    '''
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), name)


def load_json(path):
    with open(path) as f:
        return json.load(f)


def load_build_json():
    '''
    Load the build json from the root directory of this repo.
    It should previously been copied there by "python setup.py prepare_build"
    '''
    fn = fpath('build.json')
    if os.path.exists(fn):
        return load_json(fn)
    else:
        return {'package_name': 'unnamed-package'}


def listdir(d, exclude=['__pycache__']):
    lst = os.listdir(d)
    lst = [os.path.join(d, e) for e in lst if e not in exclude]
    files = [e for e in lst if os.path.isfile(e)]
    dirs = [e for e in lst if os.path.isdir(e)]
    return dirs, files


def copy(src, dst):
    print('Copy "{}" to "{}"'.format(src, dst))
    assert os.path.exists(src), "'{}' not found.".format(src)
    os.makedirs(os.path.dirname(dst), exist_ok=True)

    if os.path.isdir(src):
        shutil.copytree(src, dst)
    elif os.path.isfile(src):
        shutil.copyfile(src, dst)


def get_store_directory():
    storage_folder = os.path.join(fpath(ROOT_MODULE), '_store')
    return storage_folder


def recreate_store_directory():
    storage_folder = get_store_directory()
    print('Clearing directory {}'.format(storage_folder))
    shutil.rmtree(storage_folder, ignore_errors=True)
    os.makedirs(storage_folder, exist_ok=True)
    return storage_folder


def get_version_filename():
    return pkg_resources.resource_filename(ROOT_MODULE, 'version.txt')


def write_version(version):
    fn = get_version_filename()
    print('Writing version {} to {}'.format(version, fn))
    with open(fn, 'w') as f:
        f.write(str(version))


def read_version():
    fn = get_version_filename()
    if os.path.exists(fn):
        with open(fn, 'r') as f:
            return f.read()
    else:
        return '0.0.0-unknown-version'


def is_init_missing(root):
    dirs, files = listdir(root)
    has_init = '__init__.py' in {os.path.basename(file) for file in files}
    has_pyfiles = '.py' in {os.path.splitext(file)[1] for file in files}
    init_missing_in_subpackage = False
    for d in dirs:
        init_missing_in_subpackage = (is_init_missing(d) or
                                      init_missing_in_subpackage)
    init_needed = has_pyfiles or init_missing_in_subpackage
    if init_needed and not has_init:
        sys.stderr.write('__init__.py missing in {}\n'.format(root))
        return True
    if init_missing_in_subpackage:
        return True
    return False


class VerifyPackage(Command):
    description = 'Verify package'
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        if is_init_missing(fpath(ROOT_MODULE)):
            sys.exit(1)


class PrepareBuild(Command):
    '''
    Copy a project's build.json to
        - the root directory, so it can be used by this script as the reference
        - to pandora/ so that it can be used by pandora's scripts

    Check if all models are present in the store.
    '''
    description = 'Prepare build'
    user_options = [
        ('build-json=', 'b', 'relative path to build.json'),
    ]

    def initialize_options(self):
        self.build_json = None

    def finalize_options(self):
        pass

    def run(self):
        assert self.build_json is not None, '--build-json not specified'
        # only as info to build script
        copy(self.build_json, fpath('build.json'))
        # for scripts/start_service.sh
        # copy(self.build_json, fpath(os.path.join(ROOT_MODULE, 'build.json')))
        import plumbum
        retcode, stdout, stderr = plumbum.local['git']['describe', '--tags'].run()
        version = stdout.strip()

        write_version(version)


setup(
    name=load_build_json()['package_name'],
    version=read_version(),
    packages=find_packages(),
    # miminal dependencies for production app
    install_requires=[
        'numpy==1.13.1',
        'pandas==0.21.0',
        'docopt==0.6.2',
        'PyYAML==3.12',
        'requests==2.11.1',
        'voluptuous==0.8.10',
        'Flask==0.11.1',
        'Flask-Cors==2.1.2',
        'python-logstash',
        'gunicorn==19.4.1',
        'sqlalchemy==1.1.14',
        'pystache==0.5.4',
        'simplejson==3.11.1',
        'python-dateutil==2.6.0',
        'pytz==2016.10',
        'h5py==2.7.0',
        'tables==3.4.2',
        'numba==0.36.1'
    ],

    cmdclass={
        'verify': VerifyPackage,
        'prepare_build': PrepareBuild
    },

    extras_require={
        'dev': ['ipdb==0.10.3',
                'ipython==6.2.1',
                'gspread==0.6.2',
                'oauth2client==4.1.2']
    },

    scripts=[
        'scripts/debug',
    ],

    # run `python3 setup.py prepare_build`
    # followed by `python3 setup.py bdist`
    # then you can check the `build` folder to see if your package data is included in
    # the binary distribution (which is used to build the docker image)
    package_data={
        '': [
            '{}'.format('build.json'),
            '{}'.format('version.txt'),
            'config/*',
            'resources/*',
            'resources/query/*',
            'templates/*',
            'static/*',
            '{}/*'.format('_store'),
            '{}/**/*'.format('_store')
        ]
    }
)
