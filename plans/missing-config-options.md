Possible to have missing config options which could be out of range.
Minion Elf colored.3mf and GNOMO+MARRONE.3mf both had prime_tower_brim_width raft_first_layer_expansion with -1 in their project options which were invalid

also need to handle the case where 3mf files have multiple plates, currently not parsing all the resulting gcodes, only parsing plate_1.gcode