import { ActionIcon, Button, Center, Checkbox, Container, Grid, Group, ScrollArea, Select, Space, TextInput, Title } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconArrowDownLeft, IconArrowsDoubleNeSw, IconArrowUpRight, IconBan, IconDeviceNintendo, IconExclamationCircle, IconRefresh, IconUserOff, IconX } from '@tabler/icons';
import { open } from '@tauri-apps/api/dialog';
import { invoke } from "@tauri-apps/api/tauri";
import { ReactElement, useEffect, useState } from "react";
import "./App.css";

interface FwRule {
    name: string
    description: string
    app_name: string
    service_name: string
    protocol: any
    icmp_type: string
    local_ports: string
    remote_ports: string
    local_adresses: string
    remote_addresses: string
    profile1: string
    profile2: string
    profile3: string
    direction: any
    action: any
    interface_types: string
    interfaces: string
    enabled: boolean
    grouping: string
    edge_traversal: boolean
}

type Direction = 'Outbound' | 'Inbound' | 'Both'

function iconFromDirection(direction: Direction) {
    return direction === 'Outbound'
        ? <IconArrowUpRight height={18} />
        : (
            direction === 'Inbound'
                ? <IconArrowDownLeft height={18} />
                : <IconArrowsDoubleNeSw height={18} />
        )
}

function rsDirToInt(x: unknown): Direction {
    if (x === 'Out')
        return 'Outbound'
    return 'Inbound'
}

function App() {

    const [rules, setRules] = useState<FwRule[]>([])
    const [direction, setDirection] = useState<Direction>('Outbound')

    async function refreshRules() {
        const result = await invoke("get_rules");
        const rules = result as FwRule[]
        // console.log(rules);

        if (rules)
            setRules(rules)
    }

    async function createRule() {
        const path = await open();
        if (typeof path !== 'string') return;
        // const exists = rules.find(x => x.app_name === path && rsDirToInt(x.direction === direction));
        // if (exists) {
        //     showNotification({ message: "Rule already exists for app " + exists.app_name, color: 'red' })
        //     return;
        // }
        const result: string = await _createRule(path as string);
        if (result) showError("Failed to create rule.", result)
        refreshRules();
    }

    async function _createRule(path: string): Promise<string> {
        if (direction !== 'Inbound') {
            const result: string = await invoke("create_rule", { path, isOut: true });
            if (result) return result
        }
        if (direction !== 'Outbound') {
            const result: string = await invoke("create_rule", { path, isOut: false });
            if (result) return result
        }
        return "";
    }

    async function removeRule(rule: FwRule) {
        const result: string = await invoke("delete_rule", { ruleName: rule.name });
        if (result) showError("Failed to delete rule.", result)
        refreshRules();
    }

    async function toggleRule(rule: FwRule) {
        if (rule.enabled) {
            const result: string = await invoke("disable_rule", { ruleName: rule.name });
            if (result) showError("Failed to disable rule.", result)
        } else {
            const result: string = await invoke("enable_rule", { ruleName: rule.name });
            if (result) showError("Failed to enable rule.", result)
        }
        refreshRules();
    }

    async function toggleRuleDirection(rule: FwRule) {
        const result: string = await _toggleRuleDirection(rule);
        if (result) showError("Failed to alter rule direction.", result)
        refreshRules();
    }

    async function _toggleRuleDirection(rule: FwRule): Promise<string> {

        const result1: string = await invoke("delete_rule", { ruleName: rule.name });
        if (result1) return result1

        const result2: string = await invoke("create_rule", {
            path: rule.app_name,
            isOut: rsDirToInt(rule.direction) === "Inbound"
        });
        if (result2) return result2

        return "";
    }

    function showError(message: string, result: string) {
        if (result === "0x80070005")
            showNotification({ message: `${message} Access Denied. (0x80070005)`, color: 'red', icon: <IconUserOff height={18} /> })
        else
            showNotification({ message: message + " " + result, color: 'red', icon: <IconExclamationCircle height={18} /> })
    }

    useEffect(() => { refreshRules() }, [])

    const grid: ReactElement[] = [];
    if (rules)
        rules.forEach(rule => {
            let smallname = rule.app_name;
            smallname = smallname.substring(smallname.lastIndexOf("\\"))

            grid.push(<Grid.Col key={rule.app_name + "_tgle"} span={1}>
                <Center><Checkbox onChange={() => toggleRule(rule)} checked={rule.enabled} /></Center>
            </Grid.Col >)
            grid.push(<Grid.Col key={rule.app_name + "_dirc"} span={1}>
                <Center><ActionIcon onClick={() => toggleRuleDirection(rule)} >{iconFromDirection(rsDirToInt(rule.direction))}</ActionIcon></Center>
            </Grid.Col >)
            grid.push(<Grid.Col key={rule.app_name + "_name"} span={9}>
                <TextInput value={rule.app_name} readOnly />
            </Grid.Col >)
            grid.push(<Grid.Col key={rule.app_name + "_actn"} span={1}>
                <ActionIcon onClick={() => removeRule(rule)} style={{ marginLeft: 7 }} ><IconX /></ActionIcon>
            </Grid.Col>)
        })
    return (
        <Container>
            <Space h='md' />
            <Title order={4} align="center">Blocked Apps</Title>
            <Space h='md' />
            <ScrollArea type="scroll" h={475}>
                <Container>
                    <Grid align='center'>
                        {grid}
                    </Grid>
                </Container>
            </ScrollArea>

            <Space h='md' />
            <Group position='apart'>
                <Group>
                    <Button w={140} onClick={createRule} leftIcon={<IconBan height={18} />}>Block App</Button>
                    <Select w={140} onChange={x => setDirection(x as Direction)} data={['Outbound', 'Inbound', 'Both']} value={direction}
                        icon={iconFromDirection(direction)} />
                </Group>
                <Button w={140} onClick={refreshRules} leftIcon={<IconRefresh height={18} />}>Refresh</Button>
            </Group>
        </Container>
    );
}

export default App;
