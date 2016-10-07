# EBI Next Generation Sequencing (NGS) Workshop
## Build
To build the course materials, run `build.sh` (requires `docker`).


## Deployment
### Software Requirements
```
IGV
bcftools 1.3.1
samtools 1.3.1
gnuplot
mirage
matplotlib Python module
bamcheck
picard-tools
vcftools
LaTeX
```

### Materials
- Ideally, bake the material into the student's home directory on the VM image.
- Provide a read-only backup tar on the remote drive, which will allow students who accidentally destroy files to recover!
