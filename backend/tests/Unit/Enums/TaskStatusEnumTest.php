<?php

namespace Tests\Unit\Enums;

use App\Enums\TaskStatusEnum;
use Tests\TestCase;

class TaskStatusEnumTest extends TestCase
{
    public function test_options_returns_value_map(): void
    {
        $this->assertSame([
            'Pending' => 'Pending',
            'In Progress' => 'In Progress',
            'Completed' => 'Completed',
        ], TaskStatusEnum::options());
    }
}
