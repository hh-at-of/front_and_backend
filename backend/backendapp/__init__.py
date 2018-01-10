import logging

log = logging.getLogger(__name__)

log.setLevel(logging.INFO)
# create console handler with a higher log level
ch = logging.StreamHandler()
ch.setLevel(logging.INFO)
# create formatter and add it to the handlers
formatter = logging.Formatter('[%(asctime)s - %(name)s - %(levelname)s] %(message)s')
ch.setFormatter(formatter)
# add the handlers to the logger
log.addHandler(ch)

print(log)
